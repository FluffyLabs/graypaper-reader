import shell from "shelljs";

// Creating the public directory if it doesn't exist
shell.mkdir("-p", "public");

// Copying files from graypaper-archive/dist to public
shell.cp("-r", "graypaper-archive/dist/*", "public");
