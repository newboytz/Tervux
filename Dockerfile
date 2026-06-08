# 1. Tunatumia Node.js rasmi yenye muundo mwepesi (Alpine)
FROM node:20-alpine

# 2. Weka working directory ndani ya container
WORKDIR /app

# 3. Copy package files kwanza ili kucache dependencies
COPY package*.json ./

# 4. Sakinisha dependencies zote za kinyamwezi
RUN npm install --production

# 5. Copy mafaili yote ya mradi wako kuingia ndani ya container
COPY . .

# 6. Hakikisha folda za data zipo na zina ruhusa sahihi
RUN mkdir -p auth_info public

# 7. Fungua port ambayo Express server yako inatumia (Mfano 3000)
EXPOSE 3000

# 8. Amri ya kuwasha bot rasmi
CMD ["node", "server.js"]
