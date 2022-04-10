# Vite CSS in JS

A framework agnostic CSS in JavaScript implementation which outputs templated CSS strings within JavaScript to actual CSS files. Primarily designed for use with JSX/TSX.

Libraries such as [Emotion CSS](https://emotion.sh/docs/@emotion/css) allow writing CSS in JavaScript, keeping component styles and logic in the same file. 
However, the resultant CSS strings are ultimately bundled within JavaScript and must be compiled in browser, slowing down page load times and increasing bundle sizes. 

This library maintains the cohesion that in-JS styling gives us, but outputs to actual .css files when bundling, using randomly generated class names to avoid conflicts.

When using the plugin, all CSS template strings get replaced with the **class name** corresponding to those styles.

## Installation

### 1. Install the package:
```sh
npm install -D vite-css-in-js
```

### 2. Add to Vite: 
```ts
//vite.config.ts

import { createCSSJSImportPlugin } from "vite-css-in-js/plugin"

export default defineConfig({
  plugins: [
    // ...your plugins,
    createCSSJSImportPlugin()
  ],
  ...
})

```

## Example

```tsx
import { css } from "vite-css-in-js"

//Variable will contain the generated class-name which corresponds to the specfied CSS
const buttonStyles = css`
   background-color: royalblue;
   color: white;

   font-size: 1.25rem;
   padding: 0.5rem 2rem;
   border-radius: 1rem;

   transition: background-color 0.2s;
   cursor: pointer;

   border: 1px solid #1c48cc;

   /* Component level selectors are permitted */
   &:hover {
      background-color: #587adf;
   }
`

//React
const MyButton = () => <button className={buttonStyles}>Click Me!</button>

//Vue
const MyButton = defineComponent({
   render() {
      return <button class={buttonStyles}>Click Me!</button>
   }
})

export default MyButton
```


### HTML and styles generated:

#### **HTML**
```html
<button class="LTttzVwJ">Click Me!</button>
```

#### **CSS**
```css
/* Produced within Vite CSS bundle */
.LTttzVwJ {
  background-color: #4169e1;
  color: #fff;
  font-size: 1.25rem;
  padding: 0.5rem 2rem;
  border-radius: 1rem;
  -webkit-transition: background-color 0.2s;
  transition: background-color 0.2s;
  cursor: pointer;
  border: 1px solid #1c48cc;
}
.LTttzVwJ:hover {
  background-color: #587adf;
}
```

#### **JavaScript (React)**
```js
const buttonStyles = "LxxeYrkb"
const MyButton = () => jsx("button", { className: buttonStyles, children: "Click Me!" })
```

#### **JavaScript (VueJs)**
```js
const buttonStyles = "LxxeYrkb"

const MyButton = defineComponent({
  render() {
    return createVNode("button", { class: buttonStyles }, [createTextVNode("Click Me!")])
  },
})
```

## Caveats
Only raw strings with no variable substitutions can be transformed. Code such as the following is not allowed and will not compile:
```tsx
const styles = css`
   background-color: ${color};
`
```
If you need to use variable substitutions in your styles, either use an alternate library (such as EmotionCSS), or extract the immutable parts to a template css string, and override everything else with in element styling, e.g.:
```jsx
import { css } from "vite-css-in-js"

const buttonStyles = css`
   font-size: 1.25rem;
   padding: 0.5rem 2rem;
   border-radius: 1rem;
   cursor: pointer;
`

const MyButton = (props) => (
   <button
      className={buttonStyles}
      style={{
         backgroundColor: props.backgroundColor
      }}
   >
      Click Me!
   </button>
)

export default MyButton
```