<template>
  <input
    class="base-input"
    :placeholder="placeholder"
    @input="$emit('input', $event.target.value)"
  />
</template>

<script>
export default {
  model: {
    prop: 'value',
  },
  props: {
    value: { type: String, default: '' },
    placeholder: { type: String, default: '' },
  },
}
</script>

<style lang="scss">
.base-input {
  width: 100%;
  font-size: 14px;
  line-height: 16px;
  font-weight: 600;
  color: #3e3f42;
  background: rgba(#eaedf3, 0.5);
  border: none;
  border-radius: 8px;
  padding: 15px 20px;
  transition: all 0.15s;

  &::placeholder {
    font-weight: 500;
    color: rgba(#3e3f42, 0.75);
  }

  &:hover {
    background: #eaedf3;
  }

  &:focus {
    outline: none;
    background: white;
    border-radius: 99px;
    box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
      0 5px 15px -5px rgba(#0f233f, 0.25);
    transition: all 0.25s;
  }
}
</style>
