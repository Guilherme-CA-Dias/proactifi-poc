import { IntegrationAppClient } from '@integration-app/sdk'

import jwt from 'jsonwebtoken'
// Your workspace key and secret.
// You can find them on the Settings page.
// Import dotenv to load environment variables
import 'dotenv/config'
import { getListActionTemplate, getCreateActionTemplate, getFlowDataCollectionTemplate } from './util.js'
import fs from 'fs'
import yaml from 'yaml'

const WORKSPACE_KEY = process.env.INTEGRATION_APP_WORKSPACE_KEY
const WORKSPACE_SECRET = process.env.INTEGRATION_APP_WORKSPACE_SECRET

console.log('Starting action generation script...')

const METHODS = {
    "list": getListActionTemplate,
    "create": getCreateActionTemplate
}

if (!WORKSPACE_KEY || !WORKSPACE_SECRET) {
  throw new Error('INTEGRATION_APP_WORKSPACE_KEY and INTEGRATION_APP_WORKSPACE_SECRET must be set in .env file')
}

console.log('Generating JWT token...')
const tokenData = {
    isAdmin: true
}

const options = {
    issuer: WORKSPACE_KEY,
    // To prevent token from being used for too long
    expiresIn: 7200,
    // HS256 signing algorithm is used by default,
    // but we recommend to go with more secure option like HS512.
    algorithm: 'HS512'
}

const token = jwt.sign(tokenData, WORKSPACE_SECRET, options)
console.log('JWT token generated successfully')

console.log('Initializing Integration App client...')
const integrationApp = new IntegrationAppClient({
    token: token
})

console.log('Integration App client initialized')

console.log('Fetching integrations...')
const integrations = await integrationApp.integrations.findAll()
console.log(`Found ${integrations.length} integrations`)

for (const integration of integrations) {
    const integrationKey = integration.key
    console.log(`Processing integration: ${integration.key}`)
    // GET https://api.integration.app/integrations/hubspot/data
    const dataCollections = await integrationApp.integration(integrationKey).getDataCollections()
    console.log(`Found ${dataCollections.length} data collections for ${integration.key}`)

    // For each data collection get it's specification.
    for (const dataCollection of dataCollections) {
        console.log(`Processing data collection: ${dataCollection.key}`)
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        const dataCollectionSpec = await integrationApp.integration(integrationKey).getDataCollection(dataCollection.key)
    
        // TODO: expose this field to official API
        dataCollectionSpec.key = dataCollection.key
        console.log(dataCollectionSpec)
        // For each method of the data collection - create an action specification
        for (const key of Object.keys(dataCollectionSpec)) {
            if (Object.keys(METHODS).includes(key)) {
                console.log(`Generating ${key} action for ${dataCollection.key}`)

                const actionTemplate = METHODS[key](dataCollectionSpec, integration)
            
                // Create dist/actions directory if it doesn't exist
                const dir = `./dist/actions/${integrationKey}`
                if (!fs.existsSync(dir)) {
                    console.log(`Creating directory: ${dir}`)
                    fs.mkdirSync(dir, { recursive: true })
                }
            
                // Write action template to YAML file
                const filePath = `${dir}/${actionTemplate.key}.yaml`
                console.log(`Writing action template to ${filePath}`)
                fs.writeFileSync(
                    filePath,
                    yaml.stringify(actionTemplate)
                )

                // Send action to Integration App
                try {
                    console.log(`Creating action: ${actionTemplate.key}`)
                    await integrationApp.actions.create(actionTemplate)
                    console.log(`Action ${actionTemplate.key} created successfully`)
                } catch (error) {
                    console.log(`Action ${actionTemplate.key} already exists, updating...`)
                    await integrationApp.integration(integrationKey).action(actionTemplate.key).patch(actionTemplate)
                    console.log(`Action ${actionTemplate.key} updated successfully`)
                }
            }
       
        }

        // For each event of data caollection - create a flow specification 
        for (const event of Object.keys(dataCollectionSpec.events)) {
            console.log(`Processing event: ${event.key}`)
            const flowTemplate = getFlowDataCollectionTemplate(event, dataCollectionSpec, integration)

            // Create dist/flows directory if it doesn't exist
            const dir = `./dist/flows/${integrationKey}`
            if (!fs.existsSync(dir)) {
                console.log(`Creating directory: ${dir}`)
                fs.mkdirSync(dir, { recursive: true })
            }

            // Write flow template to YAML file
            const filePath = `${dir}/${flowTemplate.key}.yaml`
            console.log(`Writing flow template to ${filePath}`)
            fs.writeFileSync(
                filePath,
                yaml.stringify(flowTemplate)
            )

            // Send flow to Integration App
            try {
                console.log(`Creating flow: ${flowTemplate.key}`)
                await integrationApp.flows.create(flowTemplate)
                console.log(`Flow ${flowTemplate.key} created successfully`)
            } catch {
                console.log(`Flow ${flowTemplate.key} already exists, updating...`)
                await integrationApp.integration(integrationKey).flow(flowTemplate.key).patch(flowTemplate)
                console.log(`Flow ${flowTemplate.key} updated successfully`)
            }
        }
    }
}

console.log('Action generation completed successfully')
