// Helper methods to be used anywhere

// spent a bit of time on this,
// for some reason it is more difficult than it seems
// you cannot stopPropagation for this to work
// this is only way to toggle checkbox consistantly
//
// el.checked = true  - does not work
// el.checked = 'true' | 'false' does not work either
// el.setAttribute('checked', 'true' | true | false | 'false') does not work either
// el.setAttribute('x-checked', 'true' | true | false | 'false') does not work either
// most of them were not be able to toggle correctly if you hide / show element etc.
// Therefore, it is better to use this helper function to not worry about it.
//
// toggleCheckbox :: Element -> Effect
export const toggleCheckbox = (el) => {
  if (el.checked) {
    el.setAttribute('checked', '')
  } else {
    el.removeAttribute('checked')
  }
}

// changeSelection :: Element -> Effect
export const changeSelection = (parent, el) => {
  Array.from(parent.querySelectorAll('option')).map((it) => {
    it.removeAttribute('selected')
  })
  if (el) el.setAttribute('selected', '')
}

// hides or shows element
//
// toggle :: Element -> Effect
export const toggle = (it) => {
  // https://github.com/nefe/You-Dont-Need-jQuery#8.2
  if (
    it.ownerDocument.defaultView.getComputedStyle(it, null).display === 'none'
  ) {
    show(it)
  } else {
    hide(it)
  }
}

// show :: Element -> Effect
export const show = (it) => {
  it.removeAttribute('style')
}

// hide :: Element
export const hide = (it) => {
  it.style.display = 'none'
}

// int :: String -> Int | null
export const int = (i) => parseInt(i, 10)
