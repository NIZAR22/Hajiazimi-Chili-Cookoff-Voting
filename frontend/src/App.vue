<script>
import logoImage from '@/assets/images/chili-logo-transparent_resized.png'

export default {
  name: 'App',
  data() {
    return {
      logoImage
    }
  }
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
      <v-img
        :src="logoImage"
        :height="48"
        :width="48"
        contain
        class="mr-3"
      ></v-img>
      <v-spacer></v-spacer>
      <v-btn to="/" text>Home</v-btn>
      <v-btn to="/voting" text>Vote</v-btn>
      <v-btn to="/admin" text>Admin</v-btn>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>
  </v-app>
</template>