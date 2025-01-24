const core = require('@actions/core');
const { ECSClient } = require('@aws-sdk/client-ecs');
const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
const { waitUntilServicesStable } = require('@aws-sdk/client-ecs');

/**
 * Validates that valid AWS credentials are available.
 * @param   {string} region - The AWS region
 * @returns {Promise<boolean>} True if credentials are valid, otherwise false
 */
const validateCredentials = async (region) => {
  const stsClient = new STSClient({ region });
  try {
    await stsClient.send(new GetCallerIdentityCommand({}));
    return true; // Credentials are valid
  } catch (error) {
    console.error('Error validating AWS credentials:', error.message);
    return false; // Credentials are not valid
  }
};

/**
 * Waits for given AWS ECS services to transition into the "servicesStable" state.
 * Times out after 10 minutes by default (customisable via params).
 * @param   {Object}   params
 * @param   {ECSClient} params.ecsClient - An AWS ECS client object
 * @param   {string}   params.cluster    - The name of the ECS cluster
 * @param   {string[]} params.services   - A list of ECS services to check for stability
 * @returns {Promise}                      A promise that resolves when services are stable
 */
const waitForStability = async ({ ecsClient, cluster, services }) => {
  return waitUntilServicesStable(
    {
      client: ecsClient,
      maxWaitTime: 600, // 10 minutes
    },
    { cluster, services }
  );
};

/**
 * Retries the ECS services stability check for the given number of retries.
 * @param   {Object}   params
 * @param   {number}   params.retries - The number of times to retry the stability check
 * @param   {boolean}  params.verbose - Whether to print verbose log messages
 * @param   {Object}   params.params  - The rest of the parameters
 * @returns {number}                    The number of tries made
 */
const retry = async ({ retries, verbose, ...params }) => {
  let currTry = 1;
  let isStable = false;

  while (currTry <= retries && !isStable) {
    try {
      if (verbose) {
        console.info(`Waiting for service stability, try #${currTry}`);
      }
      await waitForStability(params);
      isStable = true;
    } catch {
      if (verbose) {
        console.warn(`Try #${currTry} failed!`);
      }
      ++currTry;
    }
  }

  return currTry;
};

/**
 * Creates an AWS ECS client using the given credentials.
 * @param   {Object}  params
 * @param   {string}  params.region - The AWS_REGION
 * @returns {ECSClient}               An AWS ECS client object
 */
const createEcsClient = ({ region }) =>
  new ECSClient({
    region,
  });

/**
 * Extracts step params from environment and context.
 * @returns {Object} The params needed to run this action
 */
const extractParams = () => {
  const params = {
    region: core.getInput('aws-region') || process.env.AWS_REGION,
    retries: parseInt(core.getInput('retries'), 10),
    cluster: core.getInput('ecs-cluster'),
    services: JSON.parse(core.getInput('ecs-services')),
    verbose: core.getInput('verbose') === 'true',
  };

  if (!params.region) {
    core.setFailed('AWS region was not provided in inputs or environment variables.');
    return null;
  }

  return params;
};

/**
 * The GitHub Action entry point.
 */
const main = async () => {
  try {
    const params = extractParams();

    if (!params) {
      return;
    }

    const credentialsValid = await validateCredentials(params.region);
    if (!credentialsValid) {
      console.error('AWS credentials are missing or invalid.');
      return;
    }

    const ecsClient = createEcsClient(params);
    params['ecsClient'] = ecsClient;

    const actualRetries = await retry(params);
    if (actualRetries > params.retries) {
      if (params.verbose) {
        console.error(`Service is not stable after ${params.retries} retries!`);
      }
      core.setFailed(`Service is not stable after ${params.retries} retries!`);
    } else {
      if (params.verbose) {
        console.log(`Service is stable after ${actualRetries} retries!`);
      }
      core.setOutput('retries', actualRetries.toString());
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

main();
