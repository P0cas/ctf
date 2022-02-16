FROM node:14.4.0

WORKDIR /usr/src/app
COPY src /usr/src/app
RUN apt update
RUN apt install libgtk2.0-0 libgtk-3-0 libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2 libxtst6 xauth xvfb libgbm-dev -y
RUN npm install
RUN npm install forever -g

CMD ["/usr/src/app/run.sh"]