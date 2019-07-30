// import App from './hanoi/App.svelte';
import App from './infinite-gallery/App.svelte';
// import App from './App.svelte';
export default new App({
	target: document.body,
	props: {
		name: 'me'
	}
});