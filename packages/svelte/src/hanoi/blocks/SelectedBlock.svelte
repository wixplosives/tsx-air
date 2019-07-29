<script>
    export let phase = 0;
</script>

<style>
    @keyframes blink {
        from {
            background-color: yellow;
        }
        to {
            background-color: gold;
        }
    }

    div {
        display: inline-block;
        width: 2vw;
        height: 5vh;
        border: solid black 1px;
        border-radius: 20%;
        animation: blink 0.3s linear infinite alternate-reverse;
    }
</style>

<div style="animation-delay:{-phase * 0.3 }s" />
