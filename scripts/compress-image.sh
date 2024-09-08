#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <filename.jpeg>"
  exit 1
fi

input_file="$1"

if [ ! -f "$input_file" ]; then
  echo "File not found: $input_file"
  exit 1
fi

base_name=$(basename "$input_file" .jpeg)

ffmpeg -i "$input_file" -c:v libaom-av1 -crf 20 -pix_fmt yuv444p -b:v 0 "${base_name}.avif"

echo "Converted $input_file to ${base_name}.avif"
