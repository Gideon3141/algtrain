export const allAlgorithms = {
  "3x3": {
    PLL: [
      {
        name: "T perm",
        alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
        image: "", // Add image URLs if you want
        status: "not learnt",
        alternates: [
          "R2 U R U R' U' R' U' R' U R'",
          "R U R' U R U2 R' F' R U R' U' R' F R2 U' R'"
        ]
      },
      {
        name: "J perm (A)",
        alg: "L' U' L F L' U' L U L F' L2 U L U",
        image: "",
        status: "learning",
        alternates: [
          "L' U' L F L' U' L U L F' L U L2"
        ]
      },
      {
        name: "J perm (B)",
        alg: "R U R' F' R U R' U' R' F R2 U' R' U'",
        image: "",
        status: "complete",
        alternates: []
      }
    ],
    OLL: [
      {
        name: "OLL 1 (Dot)",
        alg: "R U2 R2 U' R2 U' R2 U2 R",
        image: "",
        status: "not learnt",
        alternates: []
      }
    ]
  },
  "2x2": {
    CLL: [
      {
        name: "CLL A",
        alg: "R2 U2 R U2 R2",
        image: "",
        status: "not learnt",
        alternates: []
      }
    ]
  },
  "megaminx": {
    LastLayer: [
      {
        name: "Example LL",
        alg: "U R U' L' U R' U' L",
        image: "",
        status: "not learnt",
        alternates: []
      }
    ]
  }
};