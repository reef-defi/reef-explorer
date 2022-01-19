<template>
  <div class="container-fluid footer mt-4">
    <footer class="text-muted">
      <div class="container">
        <div class="row pt-3">
          <div class="col-lg-6">
            <ul class="list-inline">
              <li class="list-inline-item">
                <nuxt-link to="/verifyContract">Verify Contract</nuxt-link>
              </li>
            </ul>
          </div>
          <div class="col-lg-6 text-lg-right">
            <ul class="list-inline">
              <li class="list-inline-item">
                <a href="https://reef.io" target="_blank">Website</a>
              </li>
              <li class="list-inline-item">
                <a href="https://docs.reef.io" target="_blank">Docs</a>
              </li>
              <li class="list-inline-item">
                <a href="https://github.com/reef-defi" target="_blank"
                  >GitHub</a
                >
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style lang="scss">
.footer {
  padding-top: 1rem;
  margin-top: 2rem !important;
  padding-bottom: 1rem;

  a {
    font-weight: 600;
    color: rgba(#4c4f58, 0.8);

    &:hover {
      background: linear-gradient(90deg, #a93185, #5531a9);
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}
</style>
