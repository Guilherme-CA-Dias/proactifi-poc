import { useEffect, useState } from 'react'
import { Connection, DataSchema, IntegrationAppClient, resolveFormulas, } from '@integration-app/sdk'

import { useIntegrationApp, useConnection } from '@integration-app/react'

/**
 * Hook that resolves dynamic parts of the data schema.
 * Until dynamic parts of the schema are resolved, the static schema is returned as a placeholder
 * to make the render more responsive.
 */
export function useDynamicDataSchema(
    schema: DataSchema | undefined,
    connectionId: string,
    value: unknown,
) {
    const integrationApp = useIntegrationApp()
    // Keep track of the schema we previously resolved. If schema changes - we need to change the placeholder.
    const [previousSourceSchema, setPreviousSourceSchema] = useState <
        DataSchema | undefined
        > (undefined)

    // This is the resolved schema we will return
    const [resolvedSchema, setResolvedSchema] = useState < DataSchema | undefined > (
        schema,
  )

    // This is the error that may occur when resolving the schema
    const [error, setError] = useState < Error | undefined > (undefined)

    async function resolveSchema(schema: DataSchema, value: unknown) {
        try {
            const resolvedSchema = await resolveFormulas < DataSchema > (schema, {
                variables: await resolveFormulas(value, {}),
                getDataCollection: connectionId
                    ? async (key, parameters) => {
                        const dataCollection = await integrationApp
                            .connection(connectionId)
                            .dataCollection(key, parameters)
                            .get()
                        return dataCollection
                    }
                    : undefined,
            })
            setResolvedSchema(resolvedSchema)
            setError(undefined)
        } catch (err) {
            setError(err as Error)
        }
    }

    useEffect(() => {
        if (schema !== previousSourceSchema) {
            setPreviousSourceSchema(schema)
            setResolvedSchema(schema)
        }

        if (schema) {
            void resolveSchema(schema, value)
        }
    }, [
        schema ? JSON.stringify(schema) : undefined,
        value ? JSON.stringify(value) : undefined,
        connectionId,
    ])

    return { schema: resolvedSchema, error }
}