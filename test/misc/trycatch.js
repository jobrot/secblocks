module.exports = async function tryExpectCatch(promise, message) {
    try {
        await promise;
        throw null;
    } catch (error) {
        assert(error, "Expected an error but did not get one");
        assert(
            error.message.search(message) >= 0,
            `Expected error with message: ${message}, got ${error} instead`,
        );
        return;
    }
}