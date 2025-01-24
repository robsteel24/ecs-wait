# ECS Wait Action - Enhanced Version

This GitHub Action monitors ECS services for stability and waits until all specified services reach a stable state. It builds upon and enhances the original [ECS Wait Action](https://github.com/oryanmoshe/ecs-wait-action) created by [OryanMoshe](https://github.com/oryanmoshe).

## 🚀 Features
- **Retries on Failure**: Automatically retries monitoring ECS services up to a configurable number of attempts.
- **Verbose Logging**: Optional verbose logging for debugging ECS service stability issues.
- **Supports Multiple Services**: Monitors multiple ECS services simultaneously in a single cluster.
- **Enhanced Error Handling**: Improved error messages and support for invalid inputs.
- **AWS SDK v3**: Upgraded to AWS SDK v3 for better performance and modularity.

## 📥 Inputs
| Name           | Description                                      | Required | Default |
|----------------|--------------------------------------------------|----------|---------|
| `aws-region`   | The AWS region where the ECS cluster is located. | Yes      | None    |
| `ecs-cluster`  | The name of the ECS cluster.                     | Yes      | None    |
| `ecs-services` | A JSON array of ECS services to monitor.         | Yes      | None    |
| `retries`      | The number of retries before timing out.         | Yes      | 5       |
| `verbose`      | Enable verbose logging (true/false).             | No       | false   |

## 📤 Outputs
| Name     | Description                                      |
|----------|--------------------------------------------------|
| `retries`| The number of attempts made before stabilizing.  |

## 📋 Example Usage

```yaml
name: Wait for ECS Services to Stabilize

on:
  workflow_dispatch:

jobs:
  wait-for-ecs:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
          aws-region: eu-west-2

      - name: Wait for ECS Services
        uses: robsteel24/ecs-wait@v2
        with:
          aws-region: eu-west-2
          ecs-cluster: dev
          ecs-services: '["servicea", "serviceb"]'
          retries: 10
          verbose: true
```

## 🛠️ Development

If you want to contribute or make changes, follow these steps:

### Clone the repository:
```bash
git clone https://github.com/robsteel24/ecs-wait.git
cd ecs-wait
```

### Install dependencies:
```bash
npm install
```

### Test locally:
```bash
node index.js
```

## 🏆 Acknowledgments

This project is based on the original [ECS Wait Action](https://github.com/oryanmoshe/ecs-wait-action) created by [oRyanMoshe](https://github.com/oryanmoshe). Enhancements have been made to modernise and extend its functionality.

## 📝 License

This project is licensed under the [MIT License](./LICENSE). See the original project for details on prior contributions.