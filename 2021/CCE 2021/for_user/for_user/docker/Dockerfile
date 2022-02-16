FROM node:14.4.0

WORKDIR /usr/src/app
COPY src /usr/src/app
RUN mkdir /usr/src/app/saves
RUN npm install
RUN npm install forever -g

CMD ["/usr/src/app/run.sh"]