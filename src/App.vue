<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

// 在根组件初始化主题，避免主题闪烁
useTheme()
</script>

<template>
  <router-view />
</template>
