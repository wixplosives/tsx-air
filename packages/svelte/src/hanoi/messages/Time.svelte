<script>
    export let message;
</script>

<style>
    span {
        color: blue;
    }
    .alert {
        color: darkred;
    }
</style>

<span class:alert={message<3} style="font-size: {1 + (10 - message) / 5}em">{message}</span>
