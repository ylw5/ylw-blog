---
title: JWT双Token鉴权之nuxt实践
date: 2023-4-10
---

# JWT 双 Token 鉴权之 nuxt 实践

>  省略后端数据校验和失败条件分支

access token 是临时的，为防止泄露，有效期短。但是这会导致每当 access token 过期，就得重新登录授权，很麻烦。于是引入 refresh token，鉴权服务器在发送 access token 给使用方的同时也发送一个 refresh token，它的有效期很长，用来刷新 access token，就不需要用户打开鉴权页面重新授权了。为保证 refresh token 安全（非常重要），需要存在使用方服务器中，cookie httponly 同站点携带，使用 https 访问鉴权服务器的刷新接口。。。。。

首先说说普通鉴权的两种方式的优缺点：

session-cookie

优：

- 会话数据（session）存储在数据库，方便控制，具有一定的安全性
- 只需传session_id，数据量小，传输快

缺点：

- 使用 cookie 存在跨域问题
- 移动端对cookie支持不是很好
- 占内存，需要服务器定时清理过期的session
- 多台服务器之间需要解决共享 session 的问题

jwt-token

优：

- 放在请求头中传输，能跨域
- 移动端支持更好
- 不需要存储在数据库中，节省内存空间，也不需要去查询数据库
- 不仅可以用于认证，也可用于交换信息

缺点：

- 无状态，不好控制，有安全隐患
- 因为有被盗后的安全隐患，所以过期时间通常都设的很短



双JWT同时吸收了两者的优点：

在客户端和服务器通信的过程中同时传递AccessToken和 RefreshToken。

AccessToken过期时间短，不存储与数据库中，RefreshToken存储与服务器。只有AccessToken过期之后才会去数据库查询 RefreshToken，如果存在，则返回新的AccessToken



## 登录授权

```javascript
const data = await $fetch('/api/auth/login', {
  method: 'POST',
  body: {
    username,
    password,
  },
})
```

服务器获得用户名和密码

```javascript
const {
  username,
  password,
} = await readBody(event)
```

根据用户名查询数据库判断用户是否存在

```javascript
const user = await getUserByUsername(username)
```

若存在，使用 brypt 将 `password` 加密与查询得用户密码（经过相同算法加密）比较

```javascript
const doesThePasswordMatch = bcrypt.compareSync(password, user.password)
```

为登录用户生成 accessToken 和 refreshToken（根据不同的密钥），都保存了用户唯一标识 id 和 token 过期时间 expiresIn

```javascript
const { accessToken, refreshToken } = generateToken(user)
```

- accessToken

  存活时间短

  ```javascript
  const generateAccessToken = (user: User) => {
    const config = useRuntimeConfig()
    return jwt.sign(
      { userId: user.id },
      config.jwtAccessTokenSecret,
      { expiresIn: '10m' },
    )
  }
  ```

- refreshToken

  存活时间长

  ```javascript
  const generateRefreshToken = (user: User) => {
    const config = useRuntimeConfig()
    return jwt.sign(
      { userId: user.id },
      config.jwtRefreshTokenSecret,
      { expiresIn: '4h' },
    )
  }
  ```

将 refreshToken 存入数据库

```javascript
await createRefreshToken({
  token: refreshToken,
  userId: user.id,
} as RefreshToken)
```

RefreshToken 表信息：

```
model RefreshToken {
  id    Int    @id @unique @default(autoincrement())
  token String @unique

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  User   User @relation(fields: [userId], references: [id])
  userId Int
}
```

将 refreshToken 添加到 cookie 中，之后该站点发出请求都携带了 refreshToken 信息

> 设置 httponly 后无法通过 js 脚本被读取（document.cookie），防止 XSS 攻击，窃取 cookie 内容。
>
> 设置 [SameSite 属性](https://www.ruanyifeng.com/blog/2019/09/cookie-samesite.html)防止 CSRF 攻击，限制第三方 cookie

```javascript
const sendRefreshToken = (event: H3Event, token: string) => {
  setCookie(event, 'refresh_token', token, {
    httpOnly: true,
    sameSite: true,
  })
}
sendRefreshToken(event, refreshToken)
```

服务端返回查询得到的用户信息和生成的 accessToken，并将 accessToken 和 user 信息存入全局状态中

```javascript
setToken(data.access_token)
setUser(data.user)
```

```javascript
const useAuthToken = () => useState<string>('auth_token')
const useAuthUser = () => useState<User>('auth_user')

const setToken = (newToken: string) => {
  const authToken = useAuthToken()
  authToken.value = newToken
}

const setUser = (newUser: User) => {
  const authUser = useAuthUser()
  authUser.value = newUser
}
```

此后客户端发送请求，将 accessToken 添加进请求头里的 authorization 字段用于后端身份校验

```javascript
$fetch(url, {
  ...options,
  headers: {
    ...options?.headers,
    authorization: `Bearer ${useAuthToken().value}`,
  },
})
```

## 服务器中间件（鉴权服务）

服务器接收请求，使用中间件校验身份

1. 获取请求头中携带的 AccessToken

   ```javascript
   const token = event.node.req.headers.authorization?.split(' ')[1]
   ```

2. token 解码校验 token 信息

    ```javascript
    const decoded = decodeAccessToken(token)
    ```

    ```javascript
    const decodeAccessToken = (token: string) => {
      const config = useRuntimeConfig()
      try {
        return jwt.verify(token, config.jwtAccessTokenSecret)
      }
      catch (error) {
        return null
      }
    }
    ```

3. 获取 token 中保存的 userId 并查询数据库得到用户信息，存储在上下文中

    ```javascript
    const userId = decoded.userId
    const user: User | null = await getUserById(userId)
    event.context.auth = { user }
    ```

校验通过，可放行继续请求资源。



## 页面初始化或刷新

身份初始化验证

```javascript
onBeforeMount(() => {
  initAuth()
})
```

```javascript
const initAuth = async () => {
  // ...
  await refreshToken()
  await getUser()
  refreshAccessToken()
  // ...
}
```

1. 更新 accessToken

```javascript
const refreshToken = async () => {
    const data = await $fetch('/api/auth/refresh')
    setToken(data.access_token)
}
```

后端查询 cookie 中是否携带 refreshToken
```javascript
const refreshToken = getCookie(event, 'refresh_token')
```

根据 refreshToken 从数据库中查询相关用户

```javascript
const user = await getUserById(token.userId)
```

生成新的 accessToken 返回客户端

```javascript
const { accessToken } = generateToken(user)
return {
  access_token: accessToken,
}
```

客户端将新的 accessToken 存储至全局状态中（将来发送的请求头 authorization 字段中都使用最新的 accessToken）

2. 获取用户信息

    ```javascript
    const getUser = async () => {
      try {
        const data = await useFetchApi('/api/auth/user')
        setUser(data.user)
        return Promise.resolve(true)
      }
      catch (error) {
        return Promise.reject(error)
      }
    }
    ```
    此时发送的请求头中携带了新的 accessToken。
    
    前文提过，请求首先经过中间件，过程略，此时用户信息会被添加到上下文中。
    
    最后将上下文中的用户信息返回客户端即可：
    
    ```javascript
    export default defineEventHandler(async (event) => {
      return {
        user: userTransformer(event.context.auth?.user),
      }
    })
    
    ```
    
    



​		





