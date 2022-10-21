<script setup lang="ts">
import { data as postList } from './post.data'
</script>

<template>
  <div id="post-list">
    <a
      v-for="post in postList"
      :key="post.title"
      class="post-item"
      :href="post.link"
    >
      <div class="title">
        <span>{{ post.title }}</span>
      </div>
      <div class="time">
        <span>{{ post.time }}</span>
      </div>
    </a>
  </div>
</template>

<style>
#post-list {
  max-width: 1024px;
  padding: 100px;
  margin: 0 auto;
}
.post-item{
  padding-left: 30px;
  display: block;
  margin: 20px 0;
  color: #626262;
  transition: all 0.2s;
}
.post-item:hover{
  color: black;
}
.title{
  line-height: 1.3em;
  font-weight: 5800;
  font-size: 20px;
  font-family: 'Inter';
  letter-spacing: 0.02em;
}
.time{
  font-family: 'KaushanScript-Regular';
  font-size: 14px;
  opacity: .4;
}

.dark .post-item{
  color: #d1cbcbde;
}
.dark .post-item:hover{
  color: #fff;
}
</style>
