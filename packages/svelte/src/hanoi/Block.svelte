<script>
    import { fly } from 'svelte/transition';
    import SimpleBlock from './blocks/SimpleBlock.svelte';
    import SelectedBlock from './blocks/SelectedBlock.svelte';
    import PartyBlock from './blocks/PartyBlock.svelte';
    export let size;
    export let blocktype;

    let miniblocks = new Array(size);
    
    const blockTypes = {
        'selected': SelectedBlock,
        'bonus': PartyBlock
    }

    $: type = blockTypes[blocktype] || SimpleBlock;


</script>

<style>
    .block {
        background-color: gray;
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        border-radius: 20%;
    }
</style>

<div class="block" transition:fly>
    {#each miniblocks as _,index}
        <svelte:component this={type} phase={index/size} {index}/>
    {/each}
</div>
