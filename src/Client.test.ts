import { enableFetchMocks } from "jest-fetch-mock";
enableFetchMocks();
import fetchMock from "jest-fetch-mock";
import { Report, Components, HybiscusClient } from "./";
const {
    Core: { Text },
} = Components;

beforeEach(() => {
    fetchMock.resetMocks();
});

describe("Testing Client", () => {
    it("Build PDF report", async () => {
        const apiKey = "P09U8Y7G";
        const taskID = "apoafajfiqwu38r";
        const postResponse = {
            task_id: taskID,
            status: "QUEUED",
        };
        const getResponse = {
            task_id: taskID,
            status: "SUCCESS",
            error_message: null,
        };
        fetchMock
            .once(() => {
                return new Promise((resolve) => {
                    resolve({
                        body: JSON.stringify(postResponse),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                });
            })
            .once(() => {
                return new Promise((resolve) => {
                    resolve({
                        body: JSON.stringify(getResponse),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                });
            });

        const client = new HybiscusClient({ apiKey });
        const report = new Report({
            report_title: "Report title",
            report_byline: "Report byline",
        }).addComponent(new Text({ text: "Text component" }));
        const result = await client.buildReport({ report });

        expect(result).toStrictEqual({
            taskID: getResponse.task_id,
            status: "SUCCESS",
            url: `https://api.hybiscus.dev/api/v1/get-report?task_id=${result.taskID}&api_key=${apiKey}`,
        });
    });

    it("Preview PDF report", async () => {
        const apiKey = "P09U8Y7G";
        const taskID = "apoafajfiqwu38r";
        const client = new HybiscusClient({ apiKey });
        const postResponse = {
            task_id: taskID,
            status: "QUEUED",
        };
        const getResponse = {
            task_id: taskID,
            status: "SUCCESS",
            error_message: null,
        };
        fetchMock
            .once(() => {
                return new Promise((resolve) => {
                    resolve({
                        body: JSON.stringify(postResponse),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                });
            })
            .once(() => {
                return new Promise((resolve) => {
                    resolve({
                        body: JSON.stringify(getResponse),
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
                });
            });

        const report = new Report({
            report_title: "Report title",
            report_byline: "Report byline",
        }).addComponent(new Text({ text: "Text component" }));
        const result = await client.previewReport({ report });
        expect(result).toStrictEqual({
            taskID: getResponse.task_id,
            status: "SUCCESS",
            url: `https://api.hybiscus.dev/api/v1/get-report?task_id=${result.taskID}&api_key=${apiKey}`,
        });
    });
});
