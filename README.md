# Vite CSS in JS
A CSS in JavaScript plugin which allows developers to write their CSS within JavaScript, while <strong>outputting to actual CSS files</strong> when bundling and <strong>avoiding class name conflicts</strong>.

Originally designed for use with JSX and <strong>React</strong> or <strong>VueJs</strong>, but can be used with <strong>any framework</strong>.

## Installation
### 1. Install the package:

```sh
npm install -D vite-css-in-js
```

### 2. Add to Vite:

```ts
/* vite.config.ts */
import { createCSSJSImportPlugin } from "vite-css-in-js"

export default defineConfig({
  plugins: [
    // ...your plugins,
    createCSSJSImportPlugin()
  ],
  ...
})

```

## Example

```jsx
/* MyButton.jsx */
import { css } from "vite-css-in-js"

//Variable will contain the class name of the specified styles
const buttonStyles = css`
	color: white;
	background-color: royalblue;
	border: 1px solid #1c48ce;

	font-size: 1.25rem;
	padding: 0.5rem 2rem;
	border-radius: 1rem;

	cursor: pointer;

	/* Component selectors & nesting is permitted */
	&:hover {
		background-color: #587adf;
	}
`

//React
export const MyButton = () => <button className={buttonStyles}>Click Me!</button>

//Vue
export const MyButton = defineComponent({
	render() {
		return <button class={buttonStyles}>Click Me!</button>
	},
})
```

### Outputs:

<img src="docs/example.png">

<details>
   <summary>Generated Code</summary>
   
   ```js
   import "vite-css-in-js@button_nMvFo3p.css"

   //Variable has been assigned the class name of the associated CSS
   const buttonStyles = "button_nMvFo3p"

   //React
   export const MyButton = () => <button className={buttonStyles}>Click Me!</button>

   //Vue
   export const MyButton = defineComponent({
      render() {
         return <button class={buttonStyles}>Click Me!</button>
      },
   })
   ```

   ```css
   /* Generated CSS */
   .button_nMvFo3p {
      color: white;
      background-color: royalblue;
      border: 1px solid #1c48ce;
      font-size: 1.25rem;
      padding: 0.5rem 2rem;
      border-radius: 1rem;
      cursor: pointer;
   }

   .button_nMvFo3p:hover {
      background-color: #587adf;
   }
   ```
</details>

## VSCode
When using with VSCode, its highly recommended to use the following plugin to enable rich CSS integration:
https://marketplace.visualstudio.com/items?itemName=styled-components.vscode-styled-components

## Caveats & Edge Cases

### 1. Variable Substitutions

Only string constants with no variable substitutions can be transformed. Code such as the following is not allowed and will not compile:

```jsx
//Not allowed!
const color = "green";
const styles = css`
	background-color: ${color};
`
```

If you need to utilize conditional styles, you may want to consider direct element styling or alternate CSS in JS libraries.

### 2. Style Ordering

Styles are ordered based on the order they appear in the syntax tree, but should be intuitive if you keep your code organized. 

In the following example, the text will be underlined and dark green in color:

```jsx
import { css } from "vite-css-in-js"

const initialStyles = css`
   text-decoration: underline;
   color: red;
`

//Declared later so will override previous styles
const overrideStyles = css`
   color: darkgreen;
`

//React
export const MyText = () => <p className={initialStyles + " " + overrideStyles}>Hello World!</p>
```

All styles get imported from the bundler's point of view at the same position as the `vite-css-in-js` import. 
Here is an example of how the internals work to illustrate the point:
```jsx
/* MyText.jsx */
import "themes/material.css"
import { css } from "vite-css-in-js"
import "./company-branding.css"

const textStyles = css`
   color: lime;
   background-color: hotpink;
   font-family: 'Comic Sans MS';
`

const extraStyles = css`
   text-decoration: underline;
`

export const MyText = () => <p className={textStyles + " " + extraStyles}>Hello World!</p>
```

Output:
```jsx
import "themes/material.css"

//Synthetic CSS imports get placed where the original css import was
import "vite-css-in-js@text_xCUP6R0.css";
import "vite-css-in-js@extra_zewBme7.css";

import "./company-branding.css"

const textStyles = "text_xCUP6R0";
const extraStyles = "extra_zewBme7";

export const MyText = () => <p className={textStyles + " " + extraStyles}>Hello World!</p>
```

### 3. CSS Imports are currently synthetic
All `css` import statements from `vite-css-in-js` will be removed via the Vite plugin at compile time to facilitate CSS generation. 
Do not use the import for purposes other than creating styles.

### 4. Class names are not guaranteed to be stable
Class names for styles are not guaranteed to be stable, and will certainly change whenever the contents of the styles is changed. 
You should not depend on a specific value for the generated class name