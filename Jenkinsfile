pipeline {
    agent any  // Use any available agent for the pipeline

    environment {
        DOCKERHUB_CREDS = credentials('dockerhub-credentials')  // Docker Hub credentials
        DOCKER_REPO = 'Marcel-1mcm/my-app'  // Your Docker Hub repository
        EC2_INSTANCE = '172.31.3.217'  // Public IP of EC2 Instance 2
        EC2_SSH_KEY = 'app-server-ssh'  // Jenkins credentials ID for SSH private key
        DOCKER_TAG = "latest-${BUILD_NUMBER}"  // Docker tag with build number
    }

    stages {
        stage('Clone Repository') {
            steps {
                git 'https://github.com/Marcel-1mcm/my-app.git'  // Clone the Node.js app repository
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    sh 'npm install'  // Install Node.js dependencies
                }
            }
        }

        stage('Test Application') {
            steps {
                script {
                    sh 'npm test'  // Run tests
                }
            }
        }

        stage('Build Docker Image') {
            agent {
                docker {
                    image 'node:16'  // Use official Node.js image for building
                    args '-v /var/run/docker.sock:/var/run/docker.sock'  // Allow Docker inside container
                }
            }
            steps {
                script {
                    sh "docker build -t $DOCKER_REPO:$DOCKER_TAG ."  // Build Docker image with a tag
                }
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh '''
                        echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin  // Log in to Docker Hub
                        docker push $DOCKER_REPO:$DOCKER_TAG  // Push the Docker image to Docker Hub
                        '''
                    }
                }
            }
        }

        stage('Deploy to EC2 Instance') {
            steps {
                sshagent(['app-server-ssh']) {  // Use the SSH key to authenticate
                    sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@$EC2_INSTANCE << 'EOF'
                        docker pull $DOCKER_REPO:$DOCKER_TAG  // Pull the latest image from Docker Hub
                        docker stop nodejs-app || true  // Stop any running container
                        docker rm nodejs-app || true  // Remove old container
                        docker run -d --name nodejs-app -p 3000:3000 $DOCKER_REPO:$DOCKER_TAG  // Run the new container
                    EOF
                    '''
                }
            }
        }
    }

    post {
        failure {
            mail to: 'your-marcelcurtise.m@gmail.com',
                 subject: "Jenkins Build Failed: ${currentBuild.fullDisplayName}",
                 body: "The build failed. Please check the logs for details."
        }
    }
}
