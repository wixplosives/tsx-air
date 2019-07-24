<script>
	import Parent from './Parent.svelte';
	import HelloWorld from './HelloWorld.svelte';
	export let name;
</script>

<Parent>
	<HelloWorld {name} />
</Parent>