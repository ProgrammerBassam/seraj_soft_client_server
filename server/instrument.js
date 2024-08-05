// Import with `import * as Sentry from "@sentry/node"` if you are using ESM
const Sentry = require("@sentry/node");
//const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
    dsn: "https://2ae90699fd9922a121ece95962772529@o4507402119938048.ingest.us.sentry.io/4507634951913472",
    release: "seraj-soft-client-server@1.0.18",
    integrations: [
        //    nodeProfilingIntegration(),
        Sentry.anrIntegration({ captureStackTrace: true })
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions

    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0,
});