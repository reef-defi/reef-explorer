<template>
  <div>
    <Header />
    <Nuxt />
    <Footer />
    <NavPanel />
  </div>
</template>

<script>
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import NavPanel from '@/components/NavPanel.vue'

export default {
  name: 'Index',
  components: {
    Header,
    Footer,
    NavPanel,
  },
}
</script>
