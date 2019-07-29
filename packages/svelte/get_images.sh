#!/bin/bash
mkdir -p ./public/data/cats
for i in {0..250}
do
  curl -X GET --url "https://api.thecatapi.com/v1/images/search?order=desc&limit=10&page=$i" -H 'x-api-key: 2b4b9c63-6ae5-4ffc-8785-22f977d009d1' > ./public/data/cats/page-$i.json &
done

mkdir -p ./public/data/dogs
for d in {0..43}
do 
  curl -X GET --url "https://api.thedogapi.com/v1/images/search?order=desc&limit=10&page=$d" -H 'x-api-key: 2e15b8cf-0187-495f-b814-842eeb7ded7a' > ./public/data/dogs/page-$d.json &
done