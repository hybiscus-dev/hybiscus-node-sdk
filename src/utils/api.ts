import crossFetch from "cross-fetch";
import { IReportDefinition } from "../Report";
import { version } from "../version";

export type TaskStatus =
    | "CREATED"
    | "SUCCESS"
    | "FAILED"
    | "RUNNING"
    | "QUEUED"
    | null;

export interface IBuildReportResponse {
    taskID: string | null;
    status: TaskStatus;
}

export type IPreviewReportResponse = IBuildReportResponse;

export interface ITaskStatusResponse {
    status: TaskStatus;
}

export interface HybiscusAPIError {
    taskID: string | null;
    status: TaskStatus;
    error: string | object | null;
}

export class API {
    asyncBaseURL: string = "https://api.hybiscus.dev/api/v1";
    apiKey: string;
    timeout: number = 60;
    fetch: typeof crossFetch;

    /**
     * Constructor for API
     * @param fetchInstance Optional user-provided fetch instance
     */
    constructor(
        apiKey: string,
        asyncBaseURL: string = "https://api.hybiscus.dev/api/v1",
        timeout: number = 60,
        fetchInstance?: typeof crossFetch,
    ) {
        this.apiKey = apiKey;
        this.asyncBaseURL = asyncBaseURL;
        this.timeout = timeout;

        /**
         * User supplied value takes precedence, followed by global fetch
         * if available and finally falls back to cross-fetch
         */
        if (fetchInstance) {
            this.fetch = fetchInstance;
        } else if (typeof fetch === "function") {
            this.fetch = fetch;
        } else {
            this.fetch = crossFetch;
        }
    }

    /**
     * Submits a build report task to the Hybiscus API for processing
     * @param reportJSON Report schema
     * @returns The task ID and task status
     */
    async buildReport(
        reportJSON: IReportDefinition,
    ): Promise<IBuildReportResponse> {
        const controller = new AbortController();
        const { signal } = controller;
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeout * 1000);
        const _response = await this.fetch(
            `${this.asyncBaseURL}/build-report`,
            {
                method: "POST",
                body: JSON.stringify(reportJSON),
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": this.apiKey,
                    "X-HYB-CLIENT": `nodejs:@hybiscus/api-v${version}`,
                },
                signal,
            },
        );
        clearTimeout(timeout);
        const contentType = _response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw {
                taskID: null,
                status: "FAILED",
                error: await _response.text(),
            } as HybiscusAPIError;
        }
        const response = await _response.json();
        if (!_response.ok) {
            const error = response.detail ?? null;
            throw {
                taskID: null,
                status: "FAILED",
                error: error,
            } as HybiscusAPIError;
        }
        return {
            taskID: response.task_id || null,
            status: response.status || null,
        };
    }

    /**
     * Submits a preview report task to the Hybiscus API for processing
     * @param reportJSON Report schema
     * @returns The task ID and task status
     */
    async previewReport(
        reportJSON: IReportDefinition,
    ): Promise<IPreviewReportResponse> {
        const controller = new AbortController();
        const { signal } = controller;
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeout * 1000);
        const _response = await this.fetch(
            `${this.asyncBaseURL}/preview-report`,
            {
                method: "POST",
                body: JSON.stringify(reportJSON),
                headers: {
                    "Content-Type": "application/json",
                    "X-API-KEY": this.apiKey,
                    "X-HYB-CLIENT": `nodejs:@hybiscus/api-v${version}`,
                },
                signal,
            },
        );
        clearTimeout(timeout);
        const contentType = _response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw {
                taskID: null,
                status: "FAILED",
                error: await _response.text(),
            } as HybiscusAPIError;
        }
        const response = await _response.json();
        if (!_response.ok) {
            const errorMessage = response.detail ?? null;
            throw {
                taskID: null,
                status: "FAILED",
                error: errorMessage,
            } as HybiscusAPIError;
        }
        return {
            taskID: response.task_id || null,
            status: response.status || null,
        };
    }

    /**
     * Gets the task status for the task ID
     * @param taskID Task ID to check
     * @returns Task status and any error message if task has failed
     */
    async getTaskStatus(taskID: string): Promise<ITaskStatusResponse> {
        const controller = new AbortController();
        const { signal } = controller;
        const timeout = setTimeout(() => {
            controller.abort();
        }, this.timeout * 1000);
        const _response = await this.fetch(
            `${this.asyncBaseURL}/get-task-status?` +
                new URLSearchParams({
                    task_id: taskID,
                }),
            {
                method: "GET",
                headers: {
                    "X-API-KEY": this.apiKey,
                    "X-HYB-CLIENT": `nodejs:@hybiscus/api-v${version}`,
                },
                signal,
            },
        );
        clearTimeout(timeout);
        const contentType = _response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw {
                taskID: null,
                status: "FAILED",
                error: await _response.text(),
            } as HybiscusAPIError;
        }
        if (!_response.ok) {
            throw {
                status: null,
                taskID,
                error: "Error retrieving task status!",
            } as HybiscusAPIError;
        }
        const response = await _response.json();
        if (response.error_message !== null) {
            throw {
                status: null,
                taskID,
                error: response.error_message,
            } as HybiscusAPIError;
        }
        return {
            status: response.status || null,
        };
    }

    /**
     * Returns a Promise that only resolves once the task reaches SUCCESS status or
     * FAILED status.
     * @param taskID Task ID to check
     * @param timeoutInterval Timeout interval in seconds
     * @returns Task status and any error message if task fails
     */
    async waitForTaskSuccess(taskID: string): Promise<ITaskStatusResponse> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(interval);
                reject({
                    status: null,
                    taskID,
                    error: `Timeout waiting for task to complete. Timeout: ${this.timeout} seconds`,
                });
            }, this.timeout * 1000);
            const interval: ReturnType<typeof setInterval> = setInterval(
                async () => {
                    try {
                        const { status } = await this.getTaskStatus(taskID);
                        if (status === "SUCCESS") {
                            clearInterval(interval);
                            clearTimeout(timeout);
                            resolve({
                                status,
                            });
                        }
                    } catch (error) {
                        clearInterval(interval);
                        clearTimeout(timeout);
                        reject({
                            status: null,
                            taskID,
                            error,
                        });
                    }
                },
                750,
            );
        });
    }
}

export const isHybiscusAPIError = (
    error: unknown,
): error is HybiscusAPIError => {
    return typeof error === "object" && "status" in error && "error" in error;
};
