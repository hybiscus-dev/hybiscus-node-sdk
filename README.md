<div align="center">
    <a href="https://hybiscus.dev">
    <img width="40%" src="https://hybiscus.dev/public/img/Wordmark.svg" alt="Hybiscus logo"/>
    </a>
</div>

<div align="center">
    Hybiscus is a REST API for generating professional looking PDF reports using a simple JSON definition. Choose from a selection pre-designed components, and just provide the content to generate high quality PDFs without the need for design skills.
</div>

---

# Hybiscus JavaScript / TypeScript SDK

![](https://img.shields.io/github/stars/hybiscus-dev/hybiscus-node-sdk?style=social)
[![npm version](https://badge.fury.io/js/@hybiscus%2Fapi.svg)](https://badge.fury.io/js/@hybiscus%2Fapi)
![CI workflow](https://github.com/hybiscus-dev/hybiscus-node-sdk/actions/workflows/ci.yml/badge.svg)
![](https://img.shields.io/github/license/hybiscus-dev/hybiscus-node-sdk)
![](https://img.shields.io/npm/dm/@hybiscus/api)
![GitHub package.json version](https://img.shields.io/github/package-json/v/hybiscus-dev/hybiscus-node-sdk)

> Official JavaScript / TypeScript library for interacting with the Hybiscus API (Cloud and Managed Cloud).

---

> [!NOTE]
> This library supersedes the previous [`@hybiscus/web-api`](https://github.com/hybiscus-dev/nodejs-hybiscus-sdk) library, which is now deprecrated in favour of this library.


<details>
<summary>If you're migrating from <code>@hybiscus/web-api</code>, see here</summary>

### ⚠️ Breaking changes from `@hybiscus/web-api`
- `reportSchema` option from `Client.HybiscusClient.buildReport` and `Client.HybiscusClient.previewReport` changed to `reportJSON`, in alignment with terminology update on API docs
- `Client.HybiscusClient.buildReport` / `Client.HybiscusClient.previewReport` throw an error if there is an error received from the API, instead of resolving with the error in the attribute `errorMessage`
- The return from `Client.HybiscusClient.buildReport` / `Client.HybiscusClient.previewReport` no longer contains the attribute `errorMessage`. Instead, the error thrown is typed with the interface `Report.IHybiscusClientError`
- Minimum version of NodeJS v20.X required
- 
</details>


---

## 🪛 Requirements

- NodeJS **20**.X or newer

## 🛠 Installation

The library can be installed via `npm` as follows:

```shell
$   npm install @hybiscus/api
```

## 🚀 Usage

This library provides a declarative API for building up the report and the components inside it. Below is a simple example to get you started:

> **Note**
> To use the Hybiscus API, you will require an API key which you can get by signing up at [https://hybiscus.dev/signup](https://hybiscus.dev/signup) for a **Free trial**. For more details of the plans on offer, see [here](https://hybiscus.dev/plans). This library can also be used with the Managed Cloud deployment of the API in your own private cloud, available to Enterprise plan subscribers.

### Quick start

1. Setup your report with components

```js
import { HybiscusClient, Report, Components } from "@hybiscus/api";
const { Core } = Components;
const { Section, Table, Row } = Core;

const section = new Section({ section_title: "title" }).addComponents([
    new Row({ width: "1/3" }),
    new Row({ width: "2/3" }).addComponents([
        new Table({
            title: "Table title",
            headings: ["URL", "Page views"],
            rows: [
                ["google.com", "500"],
                ["bing.com", "50"],
            ],
        }),
    ]),
]);

const report = new Report(
    {
        report_title: "Report title",
        report_byline: "The byline",
    },
    {
        color_theme: "forest",
    },
);
report.addComponent(section);
```

2. Initialise an instance of `HybiscusClient`, and call the `buildReport` method.

```typescript
const client = new HybiscusClient({
    apiKey: "<<API_KEY>>"
});
try {
    const response = await client.buildReport({ report });
    console.log(response);
} catch (error) {
    console.error(error);
}
```

`client.buildReport` returns an object if the PDF report generation succeeds, with
the following format:


```ts
type TaskStatus =
    | "CREATED"
    | "SUCCESS"
    | "FAILED"
    | "RUNNING"
    | "QUEUED"
    | null;

interface IBuildReportResponse {
    taskID: string | null;
    status: TaskStatus;
}
```

### Components

Classes are available for each of the components in the Hybiscus API. All component classes follow the same basic principle, where they must be instantiated using the options defined in the [API docs](https://hybiscus.dev/docs).

> [!TIP]
> The variable naming format for component options is maintained as
> `snake_case` in line with the format used in the REST API, which is detailed in the [API docs](https://hybiscus.dev/docs) online. Although `snake_case` is not consistent with JavaScript / TypeScript `camelCase` convention, it was done to improve the developer experience and reduce the mental overhead when switching between the [API docs](https://hybiscus.dev/docs) online and this library.

Components which are specified as extendable in the API docs, have the optional method `.addComponents` or `.addComponent`, which you can use to add components within them. Components can be deeply nested through this way, giving a lot flexibility.

```js
import { Components } from "@hybiscus/api";
const { Core } = Components;
const { Section, Text } = Components;

const section = new Section({ section_title: "title" })
    .addComponents([
        new Section({ section_title: "Sub-section" })
            .addComponents([
                new Text({ text: "Example text" }),
                new Text({ text: "More example text" }),
            ]);
        new Section({ section_title: "Sub-section" })
            .addComponents([
                new Text({ text: "Example text" }),
                new Text({ text: "More example text" }),
            ]);
    ])
```

This forms part of the declarative API, which lets you define the report contents without worrying about layout and design, and focusing on content.

### Client

The class `HybiscusClient` requires at minimum to be initialised with your API token. The complete list of options that can be configured as follows:

Option | Type | Description
--- | --- | ---
`apiKey` | `String` | API key for the target API service.
`asyncBaseURL` | `String` | The base URL for the async API endpoints. Defaults to `https://api.hybiscus.dev/api/v1`.
`timeout` | `number` | The timeout in seconds for API calls to timeout.
`fetchInstance` | `crossFetch` | Instance of `crossFetch` or `fetch` compatible API

Two functions are available which correspond to the two API endpoints:

- Build report (`.buildReport`)
- Preview report (`.previewReport`)

The `.previewReport` function generates a low resolution JPEG preview of the report, which doesn't count against your monthly quota.

Both functions accept either an instance of the `Report` class for the
`report` parameter, or an object in the `reportJSON` parameter, which
has the report defined according to the [API documentation online](https://hybiscus.dev/docs/).

```typescript
import { HybiscusClient } from "@hybiscus/api";

const client = new HybiscusClient({
    apiKey: "<<API_KEY>>"
});

const reportJSON = {
    type: "Report",
    options: {
        report_title: "Report title"
    },
    components: [
        {
            type: "Text",
            options: {
                text: "Lorem ipsum dolor sit amet"
            }
        }
    ]
};
try {
    const response = await client.previewReport({ reportJSON });
    console.log(response);
} catch (error) {
    console.error(error);
}
```

#### Usage with Managed Cloud
If you are an [Enterprise plan subscriber](https://hybiscus.dev/pricing), you will be able to deploy a private instance
of the Hybiscus API within your own private cloud, known as the [Managed Cloud API](https://hybiscus.dev/docs/managed-cloud/introduction). This
library can also be used with that deployment, by simply providing the base URL to `HybiscusClient`.

For example, if your Azure Container Apps application URL is `https://hybiscus.azurecontainerapps.io/`, then
the async base URL must be `https://hybiscus.azurecontainerapps.io/api/v1/async`. This is because `asyncBaseURL` must incorporate the full path to the async API endpoint group.

> [!NOTE] 
> For the Managed Cloud API, separate async and sync API endpoints are available. This library currently only supports the `async` API endpoints.

```typescript
import { HybiscusClient } from "@hybiscus/api";

const client = new HybiscusClient({
    asyncBaseURL: "https://hybiscus.azurecontainerapps.io/api/v1/async",
    apiKey: process.env.HYBISCUS_API_KEY
});

```

#### Error handling
If calling any of the methods on `HybiscusClient` fails, an error will be thrown
using the following object

```ts
interface HybiscusAPIError {
    status: TaskStatus;
    taskID: string | null;
    error: string | object | null;
}
```

You can use the following helper function to handle errors

```typescript
import { HybiscusClient, isHybiscusAPIError } from "@hybiscus/api";

try {
    ...
} catch (error) as  error {
    if (isHybiscusAPIError(error)) {
        console.error("Status:", error.status);
        console.error("Task ID:", error.taskID);
        console.error("Error message:", error.error);
    } else {
        console.error(error);
    }

}

```

### Using a custom HTTP client

By default Hybiscus will use native `fetch`, falling back to `cross-fetch` if no native implementation is available. You can use an alternative fetch implementation by passing an instance of it as the second argument of the `HybiscusClient` constructor. This client must support the Fetch API.

```js
import nodeFetch from "node-fetch";

const client = new HybiscusClient({ 
    apiKey: "<<API_KEY>>",
    fetchInstance: nodeFetch
});
```

## 📖 Documentation

Documentation can be autogenerated using `jsdoc` by running `npm run doc`. This will generate HTML documentation in the `docs/` folder which can be viewed directly in a browser without the need for a web server.

---

&copy; 2025, Hybiscus
