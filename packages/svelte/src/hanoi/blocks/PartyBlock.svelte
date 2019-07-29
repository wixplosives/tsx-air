<script>
    import api from '../store';
    export let phase = 0;
    export let index;
</script>

<style>
    @keyframes blink {
        0% {
            background-color: pink;
        }
        10% {
            background-color: orange;
        }
        20% {
            background-color: red;
        }
        30% {
            background-color: yellow;
        }
        40% {
            background-color: yellowgreen;
        }
        50% {
            background-color: greenyellow;
        }
        60% {
            background-color: blueviolet;
        }
        70% {
            background-color: lightcyan;
        }
        80% {
            background-color: lightcoral;
        }
        90% {
            background-color: lightblue;
        }
        100% {
            background-color: aquamarine;
        }
    }

    div {
        display: inline-block;
        width: 2vw;
        height: 5vh;
        border: solid black 1px;
        border-radius: 20%;
        animation: blink 0.8s linear infinite alternate-reverse;
    }
</style>

<div style="animation-delay:{phase * 0.4}s" on:click={() => api.partyTileClicked(index)} />
