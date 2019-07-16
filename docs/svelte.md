# Analysis: [Svelte.js](https://github.com/sveltejs/svelte)
 ![Svelte logo](https://svelte.dev/svelte-logo-horizontal.svg "Svelte.js")
<p>
  <a href="https://www.npmjs.com/package/svelte">
    <img src="https://img.shields.io/npm/dw/svelte.svg" alt="npm version">
  </a>

  <a href="https://www.npmjs.com/package/svelte">
    <img src="https://img.shields.io/npm/v/svelte.svg" alt="npm version">
  </a>

  <a href="https://packagephobia.now.sh/result?p=svelte">
    <img src="https://packagephobia.now.sh/badge?p=svelte" alt="install size">
  </a>

  <a href="https://travis-ci.org/sveltejs/svelte">
    <img src="https://api.travis-ci.org/sveltejs/svelte.svg?branch=master"
         alt="build status">
  </a>

  <a href="https://github.com/sveltejs/svelte/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/svelte.svg" alt="license">
  </a>
</p>

## Overview
Svelte is a component base framework that optimizes components at buildtime.
Each component is represented as a single file that contains the code, HTML & style.
It provides a lightweight modular runtime for component lifecycle management as well as reactive binding, stores etc.

### Advantages 👍
- Compact, declarative input (typically smaller than React, in some cases significantly)
- Small output with minimal (framework) runtime code
- Active, growing  community ( ![Contributors badge](https://img.shields.io/github/contributors/sveltejs/svelte.svg "Contributors") )

### Disadvantages 👎
- No typescript support (although the framework itself it written in TS 🤔)
- Proprietary templating syntax (with rich yet limited capabilities)
- Far from being a standard - at the time of writing, 20k starred on github (Angular: 49k, React: 132K, Vue: 143K)
- Less mature

## In depth review
### TypeScript Support
There is a non-trivial gap with TS support. There have been [discussions](https://github.com/sveltejs/svelte/issues/418) and [open issues](https://github.com/sveltejs/svelte/issues/1639) but no real progress. <br />
[This repo is a notable effort](https://github.com/pyoner/svelte-typescript) to include TS support in the script tag, but is not perfect and does not make an attempt to include the HTML template yet.
#### The TS gap
- The Svelte compiler offers a preprocessing hook that seems to be a good place to transpile TS => JS, however this approach is lacking some regards, especially in the HTML template.
- LSP is a challenge (which at the moment no one seems to be taking on, as no real TS support exists)

### Features Comparison (vs React)
+ Svelte is a more structured and less flexible than react (which has advantages and disadvantages) which encourages developers to create simpler components.
+ Svelte offers built in features that react lacks:
    - View binding (making much of the state management code redundant)
    - Reactive and derived values (making the code more compact at the expanse of more framework-dependent code)
    - Built in stores
+ Manipulation of children, reparenting etc is possible but less straightforward than React
+ SSR is well supported as a compile output, a [NextJs](https://nextjs.org/)-like project called [Sapper](https://github.com/sveltejs/sapper) is being developed but is not production ready.


### Syntax
Simple, full featured template engine with loops, conditionals etc.
Less flexible than TSX
Takes some getting used to and has a learning curve: things that are vanilla like in JSX (conditional rendering, iterating) require a proprietary syntax.
While techniques and approaches differ, *Svelte seems to cover all necessary usecases* **Needs further verification**

## Code transpilation:
### Hello {world} 
#### Source:
```svelte
<script>
	export let name;
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1>Hello {name}!</h1>
```

#### Output - SSR:
```js
import { create_ssr_component, escape } from "svelte/internal";

const css = {
	code: "h1.svelte-i7qo5m{color:purple}",
	map: "{\"version\":3,\"file\":null,\"sources\":[null],\"sourcesContent\":[\"<script>\\n\\texport let name;\\n</script>\\n\\n<style>\\n\\th1 {\\n\\t\\tcolor: purple;\\n\\t}\\n</style>\\n\\n<h1>Hello {name}!</h1>\\n\"],\"names\":[],\"mappings\":\"AAKC,EAAE,cAAC,CAAC,AACH,KAAK,CAAE,MAAM,AACd,CAAC\"}"
};

const Component = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { name } = $$props;

	if ($$props.name === void 0 && $$bindings.name && name !== void 0) $$bindings.name(name);

	$$result.css.add(css);

	return `<h1 class="svelte-i7qo5m">Hello ${escape(name)}!</h1>`;
});

export default Component;
```
#### Output: Runtime
```js
import {
	SvelteComponentDev,
	add_location,
	append,
	attr,
	children,
	claim_element,
	claim_text,
	detach,
	element,
	init,
	insert,
	noop,
	safe_not_equal,
	set_data,
	text
} from "svelte/internal";

const file = undefined;

function add_css() {
	var style = element("style");
	style.id = 'svelte-i7qo5m-style';
	style.textContent = "h1.svelte-i7qo5m{color:purple}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjpudWxsLCJzb3VyY2VzIjpbbnVsbF0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG5cdGV4cG9ydCBsZXQgbmFtZTtcbjwvc2NyaXB0PlxuXG48c3R5bGU+XG5cdGgxIHtcblx0XHRjb2xvcjogcHVycGxlO1xuXHR9XG48L3N0eWxlPlxuXG48aDE+SGVsbG8ge25hbWV9ITwvaDE+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS0MsRUFBRSxjQUFDLENBQUMsQUFDSCxLQUFLLENBQUUsTUFBTSxBQUNkLENBQUMifQ== */";
	append(document.head, style);
}

function create_fragment(ctx) {
	var h1, t0, t1, t2;

	return {
		c: function create() {
			h1 = element("h1");
			t0 = text("Hello ");
			t1 = text(ctx.name);
			t2 = text("!");
			this.h()
		},

		l: function claim(nodes) {
			h1 = claim_element(nodes, "H1", { class: true }, false);
			var h1_nodes = children(h1);

			t0 = claim_text(h1_nodes, "Hello ");
			t1 = claim_text(h1_nodes, ctx.name);
			t2 = claim_text(h1_nodes, "!");
			h1_nodes.forEach(detach);
			this.h();
		},

		h: function hydrate() {
			attr(h1, "class", "svelte-i7qo5m");
			add_location(h1, file, 10, 0, 82);
		},

		m: function mount(target, anchor) {
			insert(target, h1, anchor);
			append(h1, t0);
			append(h1, t1);
			append(h1, t2);
		},

		p: function update(changed, ctx) {
			if (changed.name) {
				set_data(t1, ctx.name);
			}
		},

		i: noop,
		o: noop,

		d: function destroy(detaching) {
			if (detaching) {
				detach(h1);
			}
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { name } = $$props;

	const writable_props = ['name'];
	Object.keys($$props).forEach(key => {
		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Component> was created with unknown prop '${key}'`);
	});

	$$self.$set = $$props => {
		if ('name' in $$props) $$invalidate('name', name = $$props.name);
	};

	return { name };
}

class Component extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-i7qo5m-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, ["name"]);

		const { ctx } = this.$$;
		const props = options.props || {};
		if (ctx.name === undefined && !('name' in props)) {
			console.warn("<Component> was created without expected prop 'name'");
		}
	}

	get name() {
		throw new Error("<Component>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set name(value) {
		throw new Error("<Component>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

export default Component;
```
