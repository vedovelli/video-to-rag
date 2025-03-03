- Store the processed video file names in a separate table, with the md5 checksum of the file. When new files are included and the pipeline is run, we should check against this table to determine if a video was already processed, avoiding processing it unnecessarily

- Research a cache mechanism to store past searches. When new searches arrive, we should check if we have the answer in the cache, serving from the cache instead of querying the vector DB and engaging OpenAI

-
