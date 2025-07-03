
function getBaseActionTemplate(method, dataCollection, integration) {
    return {
        "key": `${method}-${dataCollection.key}-${integration.key}`,
        "name": `${method[0].toUpperCase() + method.slice(1)} ${dataCollection.name[0].toUpperCase() + dataCollection.name.slice(1)}`,
        "integrationId": integration.id,
        "inputSchema": {
            "type": "object",
            "properties": {
                "parameters": dataCollection.parametersSchema,
            }
        },
        "config": {
            "dataSource": {
                "collectionKey": dataCollection.key,
                ...(dataCollection.parametersSchema && {"collectionParameters": {
                    "$var": "$.input.parameters"
                }})
            },
        },
    }
}

export function getListActionTemplate(dataCollection, integration) {
    const actionTemplate = getBaseActionTemplate("list", dataCollection, integration);
    actionTemplate.type="list-data-records"
    actionTemplate.config.cursor = {
        "$var": "$.input.cursor"
    }
    actionTemplate.inputSchema.properties["cursor"] = {
        "type": "string",
        "description": "The cursor to use for pagination"
    }
    return actionTemplate;
}
export function getCreateActionTemplate(dataCollection, integration) {
    const actionTemplate = getBaseActionTemplate("create", dataCollection, integration);
    actionTemplate.type="create-data-record"
    actionTemplate.inputSchema.properties["fields"] = {
        "$dataSchemaRef": {
            "type": "data-collection",
            "key": dataCollection.key,
            "parameters": {
                "$var": "$.parameters"
            }
        }
    }
    return actionTemplate;
}


export function getFlowDataCollectionTemplate(event, dataCollection, integration) {
    return {
        "key": `${event}-${dataCollection.key}-${integration.key}`,
        "name": `${event[0].toUpperCase() + event.slice(1)} ${dataCollection.name[0].toUpperCase() + dataCollection.name.slice(1)}`,
        "integrationId": integration.id,
        "parametersSchema": dataCollection.parametersSchema,
        "nodes": {
            "trigger": {
                "type": `data-record-${event}-trigger`,
                "name": `Created: ${dataCollection.name}`,
                "config": {
                    "dataSource": {
                        "collectionKey": dataCollection.key,
                        ...(dataCollection.parametersSchema && {
                            "collectionParameters": {
                                "$var": "$.flowInstance.parameters"
                            }
                        })
                    }
                },
                "links": [
                    {
                        "key": event == "deleted" ? "api-request-to-your-app" : "find-data-record-by-id"
                    }
                ]
            },
            ...(event == "deleted" ? {} : {
                "find-data-record-by-id": {
                    "type": "find-data-record-by-id",
                    "name": "Find Data Record By Id",
                    "config": {
                        "dataSource": {
                            "collectionKey": dataCollection.key,
                            ...(dataCollection.parametersSchema && {
                                "collectionParameters": {
                                    "$var": "$.flowInstance.parameters"
                                }
                            })
                        },
                        "id": {
                            "$var": "$.input.trigger.record.id"
                        }
                    },
                    "links": [
                        {
                            "key": "api-request-to-your-app"
                        }
                    ]
                }
            }),
            "api-request-to-your-app": {
                "type": "api-request-to-your-app",
                "name": "Send event to HighLevel API",
                "config": {
                    "request": {
                        "uri": "/events",
                        "method": "POST",
                        "body": {
                            "integrationKey": {
                                "$var": "$.integration.key"
                            },
                            "connectionId": {
                                "$var": "$.connection.id"
                            },
                            "instanceKey": {
                                "$var": "$.flowInstance.instanceKey"
                            },
                            ...(event == "deleted" ? {} : {
                                "data": {
                                    "$var": "$.input.find-data-record-by-id"
                                },
                            }),
                            "recordId": {
                                "$var": "$.input.trigger.record.id"
                            }
                        }
                    }
                },
            }
        },
    }
}
