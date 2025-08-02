function debounce(fn, delay = 500) {
  let timer = null

  return function () {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }

    const that = this
    const args = arguments
    timer = setTimeout(() => {
      fn.apply(that, args)
    }, delay)
  }
}

export default debounce
