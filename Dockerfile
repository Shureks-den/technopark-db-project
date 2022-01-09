FROM ubuntu:20.04

RUN apt-get -y update && apt-get install -y tzdata
ENV TZ=Russia/Moscow
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENV PGVER 12
RUN apt-get install -y postgresql-${PGVER}

USER postgres

RUN /etc/init.d/postgresql start &&\
    psql --command "CREATE USER technopark WITH SUPERUSER PASSWORD 'technopark';" &&\
    createdb -O technopark technopark &&\
    /etc/init.d/postgresql stop

RUN echo "host all  all    0.0.0.0/0  md5" >> /etc/postgresql/$PGVER/main/pg_hba.conf

RUN echo "listen_addresses='*'" >> /etc/postgresql/$PGVER/main/postgresql.conf

VOLUME  ["/etc/postgresql", "/var/log/postgresql", "/var/lib/postgresql"]

USER root

RUN apt-get install -y curl
RUN curl —silent —location https://deb.nodesource.com/setup_17.x | bash -
RUN apt-get install -y nodejs
RUN apt-get install -y build-essential

WORKDIR /usr/src/app

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 5000

ENV PGPASSWORD technopark

CMD service postgresql start && psql -h localhost -d technopark -U technopark -p 5432 -a -q -f ./db/db.sql && npm run start