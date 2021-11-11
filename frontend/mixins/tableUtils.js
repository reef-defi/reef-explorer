export default {
  data() {
    return {
      activeSort: {
        property: null,
        descending: false,
      },
    }
  },
  methods: {
    paginate(list, perPage, currentPage) {
      if (!list || !perPage || !currentPage) return []

      const start = perPage * (currentPage - 1)
      const end = start + perPage
      return list.slice(start, end)
    },
    sort(list, config = this.activeSort) {
      if (!list) return []
      const key = config?.property
      if (!key) return list

      const descending = !!config.descending

      return list.sort((a, b) => {
        const keyA = a[key]
        const keyB = b[key]

        if (keyA < keyB) return descending ? 1 : -1
        if (keyA > keyB) return descending ? -1 : 1

        return 0
      })
    },
  },
}
