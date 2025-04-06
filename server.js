const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const originalName = file.originalname;
    const uploadDir = path.join(__dirname, "uploads");
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);

    let newName = originalName;
    let counter = 1;

    // Fonction récursive pour vérifier si le fichier existe
    const checkAndRename = () => {
      const fullPath = path.join(uploadDir, newName);
      fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
          // Fichier n'existe pas, on peut l'utiliser
          cb(null, newName);
        } else {
          // Fichier existe, on modifie le nom
          newName = `${base}(${counter++})${ext}`;
          checkAndRename();
        }
      });
    };

    checkAndRename();
  },
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.static("uploads"));

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("Aucun fichier reçu");
  }
  res.send("Fichier reçu : " + req.file.originalname);
});

app.get("/files", (req, res) => {
  fs.readdir("uploads/", (err, files) => {
    if (err) {
      return res.status(500).send("Erreur serveur");
    }
    res.send(files.join("\n"));
  });
});

app.delete("/delete/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  fs.unlink(filePath, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        return res.status(404).send("Fichier non trouvé");
      }
      return res.status(500).send("Erreur lors de la suppression");
    }
    res.send("Fichier supprimé : " + filename);
  });
});

app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads", filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).send("Fichier non trouvé");
    }
    res.download(filePath, filename, (err) => {
      if (err) {
        return res.status(500).send("Erreur lors du téléchargement");
      }
    });
  });
});

app.listen(3000, () => {
  console.log("Serveur lancé sur http://localhost:3000");
});
