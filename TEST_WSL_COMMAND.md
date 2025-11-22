# Test WSL Command

Testez cette commande depuis PowerShell Windows:

```powershell
wsl bash -c "source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; walrus --version"
```

Si ça ne fonctionne pas, essayez:

```powershell
wsl -d Ubuntu bash -c "source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; walrus --version"
```

Ou:

```powershell
wsl -- bash -c "source ~/.bashrc 2>/dev/null || true; source ~/.profile 2>/dev/null || true; walrus --version"
```

