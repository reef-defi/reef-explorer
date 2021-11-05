export default {
  methods: {
    paginate(list, perPage, currentPage) {
      if (!list || !perPage || !currentPage) return []

      const start = perPage * (currentPage - 1)
      const end = start + perPage
      return list.slice(start, end)
    },
  },
}
