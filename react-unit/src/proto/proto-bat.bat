@echo off
protoc.exe --js_out=import_style=commonjs,binary:. *.proto