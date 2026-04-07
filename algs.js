export const allAlgorithms = {
  "3x3": {
    "PLL": [
      {
        name: "Ua Perm",
        alg: "R U' R U R U R U' R' U' R2",
        scramble: "R U2 R' U' R U R' U2 R U' R'",
        alternates: ["R U R' U' R' F R2 U' R' U' R U R' F'"],
        status: "not learnt",
        image: "" // no image for PLL
      },
      {
        name: "Ub Perm",
        alg: "R2 U R U R' U' R' U' R' U R'",
        scramble: "R2 U R U R' U' R' U' R' U R'",
        alternates: ["R' U' R U' R' U2 R", "M2 U M2 U2 M2 U M2"],
        status: "not learnt",
        image: ""
      },
      {
        name: "Z Perm",
        alg: "M2 U M2 U M' U2 M2 U2 M' U2",
        scramble: "M2 U M2 U M' U2 M2 U2 M' U2",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "H Perm",
        alg: "M2 U M2 U2 M2 U M2",
        scramble: "M2 U M2 U2 M2 U M2",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Aa Perm",
        alg: "x R' F R' B2 R F' R' B2 R2 x'",
        scramble: "x R' F R' B2 R F' R' B2 R2 x'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Ab Perm",
        alg: "x R B' R F2 R' B R F2 R2 x'",
        scramble: "x R B' R F2 R' B R F2 R2 x'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "E Perm",
        alg: "x' R U' R' D R U R' D' R U R' D R U' R' D'",
        scramble: "x' R U' R' D R U R' D' R U R' D R U' R' D'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "F Perm",
        alg: "R' U2 R U R' U R F R U R' U' R' F' R",
        scramble: "R' U2 R U R' U R F R U R' U' R' F' R",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Ga Perm",
        alg: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
        scramble: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
        alternates: ["R2 U R' U R U' R' U R2 D U R' U' R D'"],
        status: "not learnt",
        image: ""
      },
      {
        name: "Gb Perm",
        alg: "R' U' R U D R2 U R' U R U' R U' R2 D'",
        scramble: "R' U' R U D R2 U R' U R U' R U' R2 D'",
        alternates: ["R' U' R U D' R2 U R' U R U' R U' R2 D"],
        status: "not learnt",
        image: ""
      },
      {
        name: "Gc Perm",
        alg: "R2 U' R U' R U R' U R2 D' R U' R' U R D",
        scramble: "R2 U' R U' R U R' U R2 D' R U' R' U R D",
        alternates: ["R2 U' R U' R' U R U R2 D' R U' R' U R D"],
        status: "not learnt",
        image: ""
      },
      {
        name: "Gd Perm",
        alg: "R U R' U' D' R2 U' R U' R' U R' U R2 D",
        scramble: "R U R' U' D' R2 U' R U' R' U R' U R2 D",
        alternates: ["R U R' U' D R2 U' R U' R' U R' U R2 D'"],
        status: "not learnt",
        image: ""
      },
      {
        name: "Ja Perm",
        alg: "x R2 F R F' R U2 r'",
        scramble: "x R2 F R F' R U2 r'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Jb Perm",
        alg: "R U R' F' R U R' U' R' F R2 U' R' U'",
        scramble: "R U R' F' R U R' U' R' F R2 U' R' U'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Na Perm",
        alg: "L U' R' U2 L' U R U2 L' U R' U2 R",
        scramble: "L U' R' U2 L' U R U2 L' U R' U2 R",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Nb Perm",
        alg: "R' U L U2 R U' L' U2 R U L U2 L'",
        scramble: "R' U L U2 R U' L' U2 R U L U2 L'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Ra Perm",
        alg: "R U' R' F' R U R' U' R' F R2 U' R' U",
        scramble: "R U' R' F' R U R' U' R' F R2 U' R' U",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "Rb Perm",
        alg: "R2 F R U R U' R' F' R U2 R' U2 R",
        scramble: "R2 F R U R U' R' F' R U2 R' U2 R",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "T Perm",
        alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
        scramble: "R U R' U' R' F R2 U' R' U' R U R' F'",
        alternates: [],
        status: "not learnt",
        image: ""
      },
      {
        name: "V Perm",
        alg: "R' U R' d R2 U' R' U R' d' R2 U2",
        scramble: "R' U R' d R2 U' R' U R' d' R2 U2",
        alternates: ["R' U R' d R2 U' R' U R d' R2 U2"],
        status: "not learnt",
        image: ""
      },
      {
        name: "Y Perm",
        alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        scramble: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        alternates: [],
        status: "not learnt",
        image: ""
      }
    ],

    "OLL": [
      {
        name: "OLL Example",
        alg: "R U2 R2 F R F' U2 R' F R F'",
        scramble: "R U R' U R U2 R'",
        alternates: [],
        status: "not learnt",
        image: "images/OLL-3x3.png" // ✅ This one shows
      }
    ]
  }
};