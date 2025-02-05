import shell from 'shelljs';

// Tworzenie katalogu public, jeśli nie istnieje
shell.mkdir('-p', 'public');

// Kopiowanie plików z graypaper-archive/dist do public
shell.cp('-r', 'graypaper-archive/dist/*', 'public');