<script>
    export let message;

    const letters = message.split('');
    const colors = letters.map(i => (Math.random() * 5)|0);

</script>

<style>
    .letter0 {
        color: goldenrod;
    }
    .letter1 {
        color: blueviolet;
    }
    .letter2 {
        color: darkcyan;
    }
    .letter3 {
        color: crimson;
    }
    .letter4 {
        color: green;
    }
</style>

{#each letters as letter, i}
    <span class="letter{colors[i]}">{letter}</span>
{/each}
