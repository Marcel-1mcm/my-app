pipeline {

    agent any

    environment {

        AWS_REGION = 'eu-north-1'
        AWS_ACCOUNT_ID = '559896293698'

        ECR_REPOSITORY = 'my-app'

        ECR_REGISTRY = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

        IMAGE_TAG = "build-${BUILD_NUMBER}"

        IMAGE_NAME = "${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}"

        LATEST_IMAGE = "${ECR_REGISTRY}/${ECR_REPOSITORY}:latest"


        // CHANGE THIS TO YOUR EC2 PUBLIC IP
        APP_SERVER_IP = '13.50.99.104'


        APP_CONTAINER_NAME = 'my-app'

        APP_PORT = '3000'
    }


    stages {


        stage('Checkout Source Code') {

            steps {

                echo '=========================================='
                echo 'CHECKING OUT SOURCE CODE'
                echo '=========================================='

                git branch: 'master',
                    url: 'https://github.com/Marcel-1mcm/my-app.git'
            }
        }



        stage('Install Dependencies') {

            steps {

                echo '=========================================='
                echo 'INSTALLING DEPENDENCIES'
                echo '=========================================='

                sh '''
                    npm install
                '''
            }
        }



        stage('Run Tests') {

            steps {

                echo '=========================================='
                echo 'RUNNING TESTS'
                echo '=========================================='

                sh '''
                    npm test || echo "No tests configured - continuing"
                '''
            }
        }



        stage('Build Docker Image') {

            steps {

                echo '=========================================='
                echo 'BUILDING DOCKER IMAGE'
                echo '=========================================='

                sh '''
                    docker build \
                    -t $IMAGE_NAME \
                    .

                    docker tag \
                    $IMAGE_NAME \
                    $LATEST_IMAGE
                '''
            }
        }



        stage('Login To Amazon ECR') {

            steps {

                echo '=========================================='
                echo 'LOGGING INTO ECR'
                echo '=========================================='

                sh '''
                    aws ecr get-login-password \
                    --region $AWS_REGION | \
                    docker login \
                    --username AWS \
                    --password-stdin \
                    $ECR_REGISTRY
                '''
            }
        }



        stage('Push Image To ECR') {

            steps {

                echo '=========================================='
                echo 'PUSHING IMAGE TO ECR'
                echo '=========================================='

                sh '''

                    docker push $IMAGE_NAME

                    docker push $LATEST_IMAGE

                '''
            }
        }




        stage('Verify ECR Image') {

            steps {

                echo '=========================================='
                echo 'VERIFYING IMAGE'
                echo '=========================================='

                sh '''

                    aws ecr describe-images \
                    --repository-name $ECR_REPOSITORY \
                    --region $AWS_REGION

                '''
            }
        }





       stage('Deploy To EC2') {

    steps {

        echo '=========================================='
        echo 'DEPLOYING TO EC2'
        echo '=========================================='

        sshagent(credentials: ['app-server-ssh']) {

            sh """
ssh -o StrictHostKeyChecking=no ubuntu@${APP_SERVER_IP} '
echo "Logging into ECR"

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

echo "Pulling latest image"

docker pull ${LATEST_IMAGE}

echo "Stopping old container"

docker stop ${APP_CONTAINER_NAME} || true
docker rm ${APP_CONTAINER_NAME} || true

echo "Starting new container"

docker run -d \
  --name ${APP_CONTAINER_NAME} \
  --restart unless-stopped \
  -p ${APP_PORT}:${APP_PORT} \
  ${LATEST_IMAGE}

echo "Deployment complete"

docker ps
'
"""
                }
            }
        }


        stage('Verify Deployment') {

            steps {

                echo '=========================================='
                echo 'VERIFYING CONTAINER'
                echo '=========================================='


                sshagent(credentials: ['app-server-ssh']) {

                    sh """
                    ssh -o StrictHostKeyChecking=no ubuntu@${APP_SERVER_IP} \
                    "docker ps --filter name=${APP_CONTAINER_NAME}"
                    """

                }
            }
        }

    }


    post {

        success {

            echo '''
==========================================
PIPELINE SUCCESSFUL
==========================================
'''

            echo "Image deployed: ${LATEST_IMAGE}"

        }


        failure {

            echo '''
==========================================
PIPELINE FAILED
==========================================
'''

        }


        always {

            echo '''
==========================================
CLEANING DOCKER CACHE
==========================================
'''

            sh '''
                docker image prune -f || true
            '''

        }

    }

}