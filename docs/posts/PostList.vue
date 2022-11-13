<script setup lang="ts">
import { data as postList } from './post.data'
</script>

<template>
  <div id="post-list">
    <h1>
      Blog
    </h1>
    <p>
      在这里分享一些近期学习的内容和心得🙂
    </p>
    <article
      v-for="post in postList"
      :key="post.title"
      class="post-item"
    >
      <div class="time">
        <span class="month">{{ post.time.month }}</span>
        <span class="day">{{ post.time.day }}</span>
        <span class="year">{{ post.time.year }}</span>
      </div>
      <div class="postinfo">
        <a class="title" :href="post.link">{{ post.title }}</a>
        <div class="description">
          {{ post.description }}
        </div>
      </div>
    </article>
  </div>
  <!-- <div class="time">
        <span>{{ post.time }}</span>
      </div> -->
</template>

<style>
#post-list {
  max-width: 800px;
  padding-top: 50px;
  margin: 0 auto;

}
#post-list h1{
  font-size: calc(1em + 1.75vw);
  font-weight: 500;
  margin-bottom: 30px;
  font-family: 'Montserrat';
}
#post-list p{
  font-size: calc(1em + .1vw);
  margin-bottom: 20px;
}
.post-item{
  display: block;
  margin: 35px 0;
  transition: all 0.2s;
  display: flex;
}
.post-item:hover{
  transform: scale(1.01);
}
.post-item:hover .title{
  color: var(--vp-c-brand);
}
.postinfo{
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 12px;
}

.postinfo .title{
  line-height: 1.8rem;
  font-weight: 700;
  font-size: calc(1em + .4vw);
  font-family: 'Montserrat';
  letter-spacing: 0.02em;
  transition: all .4s;
}
.postinfo .description{
  font-size: .8em;
}
.time{
  display: flex;
  flex-direction: column;
  font-family: 'AtkinsonHyperlegible-Regular';
  font-size: .8em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-right: .7rem;
  border-right: 2px solid rgb(162, 157, 157);
  line-height: 1.3rem;
}
.time .month,
.time .day{
  font-family: 'AtkinsonHyperlegible-Bold';
}
</style>
