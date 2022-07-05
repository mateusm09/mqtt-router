# Pre stage for installing typescript dependencies
# then build ts files and cpoy for the next stage 
FROM node:14.18.1
WORKDIR /usr
COPY package.json ./
COPY yarn.lock ./
COPY tsconfig.json ./
# ADD ORMFILE
COPY src ./src
RUN ls -a
RUN yarn install
RUN yarn build

# Alpine image with only js files
FROM node:14.18.1
WORKDIR /usr/acesso
COPY package.json ./
RUN yarn install --production
COPY --from=0 ./usr/build .
EXPOSE 3000
CMD ["node", "src/index.js"]