# BF4U API

To build docker container run `docker build -t less/bfapi .`
then stop container run `docker container stop /bfapi`
then remove current container `docker container rm /bfapi`
And finally run `docker container run --publish 8000:8080 --detach --name bfapi less/bfapi`# bf4u_api
