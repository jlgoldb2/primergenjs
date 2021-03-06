var $pg =  $pg || {};

//it is necessary to determine which pole of the DNA...
//sequence is to the left and which is to the right...
//the default is 5'-DNAHERE-3'.
//if not oriented properly..
// primers won't function for PCR
/*" By convention, if the base sequence of a single strand of DNA is given,
 the left end of the this is 5' end, while the right end of the
  this is the 3' end."
AND
"All known DNA replication systems require a free 3' hydroxyl group
 before synthesis can be initiated"
*/

//returns the complement of the param 'this' as this is presented. i.e. 
//  passed   = "ATTTTAGCGATCCC"
// f_seq is for "forward sequence"

$pg.genComplement = function(seq) {
  var complement = "";
  var decoder = { 
    "T": "A",
    "A": "T",
    "C": "G",
    "G": "C"
  };
  for (var i = 0; i < seq.length; i++) {
    complement += decoder[seq[i]];
  }
  return complement;
};


//returns substring from beginning of seq (in 5'-to-3' format)
//Forward primer is oriented the same as original this.
//if param 'forward' is true(default), primer is generated directly from sequence
//if param 'forward' is false, primer is generated as a reverse primer
$pg.genPrimer = function(seq , primerStart, primerLength, isForward) {
  isForward = isForward ? true : false;
  if (isForward){
    return seq.substring(primerStart, primerStart + primerLength);
  }
  else {
    var primer = seq.substring(seq.length-primerStart, seq.length - (primerStart+primerLength));
    //gets substring from end of seq then returns complement in (3'-to-5' format)
    
    primer = $pg.genComplement(primer);
    //Reverse primer must be oriented 5'-to-3' prior to chemical evaluation
    return $pg.seqReverse(primer);
  }
};
//returnes the reverse of a sequence 
//(turns 3'-to-5' around to show 5'-to-3')
// used to turn reverse 
$pg.seqReverse = function(seq) {
  return seq.split("").reverse().join("");
};

//function to generate a pseudo random DNA primergen (non-degenerate bases)
$pg.genRandomSeq = function(seqLength) {
  var dnaBases = ["A", "T", "G", "C"];
  var ampSeqPlus = "";
  for (var i = 0; i < seqLength; i++) {
    ampSeqPlus = ampSeqPlus + dnaBases[Math.floor(Math.random() * dnaBases.length) ];
    }
  return ampSeqPlus;
};


$pg.getNNPairs = function(primer){
  if (primer.length < 2) {return false};
  var nearestNeighbors = [];
  for (var i = 0; i < primer.length; i++){
    nearestNeighbors.push(primer[i] + (primer[i+1] || ""));
  }
  nearestNeighbors.splice(nearestNeighbors.length-1, 1);
  return nearestNeighbors;
};


$pg.Sequence = function(sequence, orientation, seqName) {
  this.sequence = sequence;
  this.seqLength = sequence.length;
  this.seqName = seqName;
  // orientation refers to the sequence being oriented in a 5'-to-3' fashion
  // by default, all functions should return 5'-to-3' sequences by default except,
  // of course, the seqReverse() function.
  this.orientation = orientation;

  //function that validates this integrity
  //only A,G,T, and C bases => true
  //bases other than A,G,T, or C => false
  this.seqIntegrityCheck = function () {
    var checker = 0;
    checker = this.sequence.search(/[~ATGC]/);
    if (checker === 0) {
      return true;
    }
    else 
      {
        return false;
      }
  };
  this.integrity = this.seqIntegrityCheck();

  //counts bases... returns number of bases.
  this.baseCount = function(seq, nucleotide) {
    return seq.split(nucleotide).length - 1;
  };

  this.sumA = this.baseCount(this.sequence, "A");
  this.sumT = this.baseCount(this.sequence, "T");
  this.sumG = this.baseCount(this.sequence, "G");
  this.sumC = this.baseCount(this.sequence, "C");

  // finds GC content of this
  //should return a number between 0 and 1.
  // e.g. given "GGCC" => 1.0
        //given "GATC" => 0.5
        //given "CCCC" => 1.0
        //given "AATC" => 0.25
  this.calcGCContent = function(seq, sumG, sumC) {
    return (sumG + sumC) / seq.length;
      };
  this.gcContent = this.calcGCContent(this.sequence, this.sumG, this.sumC);

};


  //R is the ideal gas constant and is equal to 1.987 cal / (K * mole).
  //the difference between degrees Kelvin and Celsius is 273.15 degrees.
  //Calculate the melting temp of oligos (read: primers) in Celcius
  //References:
      //Sugimoto et al., (1996) Nucl. Acids Res. 24:4501-4505 
      //Breslauer et al., (1986) Proc. Nat. Acad. Sci. 83:3746-50
      // In Sugimoto's "Improved thermodynamic parameters and helix initiation factor to predict stability of DNA duplexes"

// All experiments were conducted in a buffer including 1 M NaCl, 10 mM Na2HPO4 and 1 mM Na2EDTA (pH 7.0)
//  1 M NaCl buffer is concentrationNaCl so found meltingTemp data is for 1 M NaCl (monovalent)

//10 kinds of nearestNeighbor sequences of Watson Crick base pairs described: 
//dAA/dTT, dAT/dAT, dCG/dCG, dCT/dAG, dGA/dTC, dGC/dGC, dGG/dCC, dGT/dAC, dTA/dTA

// (deltaGof(37) = 3.4 kcal/mol) this means that measurements of deltaG were taken at 37 degrees Celsius
//  a free energy change at37degreesC (deltaG(37)) of the helix formation consist of three terms:
// (i) a free energy change for helix propagation as a sum of each subsequent base pair
// (ii) a free energy change for helix initiation
// (iii) a free energy change of an entropy effect when the duplex is composed of self-complementary strands

//deltaH is enthalpy
//deltaS is entropy
//deltaG is gibbs free energy
$pg.Chemistry = function() {
  this.forwardPrimerNNs = $pg.getNNPairs(seqs.forwardPrimer)
  this.reversePrimerNNS = $pg.getNNPairs(seqs.reversePrimer)

  this.calcMeltingTempNN = function(nearestNeighborObj) {
    var IDEALGASCONST = 1.987;
    var enthalpy = $pg.dataTables.nearestNeighborTable[nearestNeighborKey].deltaH;
    var concentrationPrimers = 0.25; // [primer] is optimally 0.1 - 0.5 uM where u is micro
    var entropy = $pg.dataTables.nearestNeighborTable[nearestNeighborKey].deltaS;
    return enthalpy / (entropy + IDEALGASCONST * Math.log(concentrationPrimers)) -273.15;
  };

  this.chooseNNChemistry = function(nnPair, table) {
    for (key in table){
      if (table[key].one === nnPair || table[key].two === nnPair) {
        return table[key];
      }
    }
  };


  this.getSequenceMeltingTemp = function(sequence) {
    var nnMeltingTemps = [];
    var nnPairArray = $pg.getNNPairs(sequence);
    for (var i = 0; i < nnPairArray.length; i++){
      nnMeltingTemps.push(this.calcMeltingTempNN(nnPairArray[i]));
      }
    return nnMeltingTemps;
  };

  this.invMonovalentTemp = function() {};
  //calc Monovalent Temp

  this.invDivalentTemp = function() {};
  //calc Divalent Temp

  this.calcWallaceTemp = function() {};
  // calc Wallace Temp (Wallace Temp)





};




$pg.dataTables = {};


//TABLE 1  
/*dAA -8.0 -21.9 -1.2
dTT
dAT -5.6 -15.2 -0.9
dTA
dTA -6.6 -18.4 -0.9
dAT
dCA -8.2 -21.0 -1.7
dGT
dCT -6.6 -16.4 -1.5
dGA
dGA -8.8 -23.5 -1.5
dCT
dGT -9.4 -25.5 -1.5
dCA
dCG -11.8 -29.0 -2.8
dGC
dGC -10.5 -26.4 -2.3
dCG
dGG -10.9 -28.4 -2.1
dCC
initiation 0.6 -9.0 3.4
self-complementary 0.0 -1.4 0.4
non-self-complementary 0.0 0.0 0.*/
$pg.dataTables.nnTABLE =[
                  ['dAA', '-8.0',  '-21.9', '-1.2', 'dTT'],
                  ['dAT', '-5.6',  '-15.2', '-0.9', 'dTA'],
                  ['dTA', '-6.6',  '-18.4', '-0.9', 'dAT'],
                  ['dCA', '-8.2',  '-21.0', '-1.7', 'dGT'],
                  ['dCT', '-6.6',  '-16.4', '-1.5', 'dGA'],
                  ['dGA', '-8.8',  '-23.5', '-1.5', 'dCT'],
                  ['dGT', '-9.4', ' -25.5', '-1.5', 'dCA'],
                  ['dCG', '-11.8', '-29.0', '-2.8', 'dGC'],
                  ['dGC', '-10.5', '-26.4', '-2.3', 'dCG'],
                  ['dGG', '-10.9', '-28.4', '-2.1', 'dCC'],
                  ['initiation', '0.6', '-9.0', '3.4'],
                  ['self-complementary', '0.0' ,'1.4', '0.4'],
                  ['non-self-complementary', '0.0', '0.0', '0.0']];

$pg.nnTable = {}
$pg.nnTable.AA = {}
$pg.nnTable.AA.match        = 'TT'
$pg.nnTable.AA.enthalpy     = -8.0
$pg.nnTable.AA.entropy      = -21.9
$pg.nnTable.AA.gibbsFE      = -1.2
$pg.nnTable.AT = {}
$pg.nnTable.AT.match        = 'TA' 
$pg.nnTable.AT.enthalpy     = -5.6
$pg.nnTable.AT.entropy      = -15.2
$pg.nnTable.AT.gibbsFE      = -0.9
$pg.nnTable.TA = {}
$pg.nnTable.TA.match        = 'AT'
$pg.nnTable.TA.enthalpy     = -6.6
$pg.nnTable.TA.entropy      = -18.4
$pg.nnTable.TA.gibbsFE      = -0.9
$pg.nnTable.CA {}
$pg.nnTable.CA.match        = 'GT'
$pg.nnTable.CA.enthalpy     = -8.2
$pg.nnTable.CA.entropy      = -21.0
$pg.nnTable.CA.gibbsFE      = -1.7
$pg.nnTable.CT = {}
$pg.nnTable.CT.match        = 'GA'
$pg.nnTable.CT.enthalpy     = -6.6
$pg.nnTable.CT.entropy      = -16.4
$pg.nnTable.CT.gibbsFE      = -1.5
$pg.nnTable.GA = {}
$pg.nnTable.GA.match        = 'CT'
$pg.nnTable.GA.enthalpy     = -8.8
$pg.nnTable.GA.entropy      = -23.5
$pg.nnTable.GA.gibbsFE      = -1.5
$pg.nnTable.GT = {}
$pg.nnTable.GT.match        = 'CA'
$pg.nnTable.GT.enthalpy     = -9.4
$pg.nnTable.GT.entropy      = -25.5
$pg.nnTable.GT.gibbsFE      = -1.5
$pg.nnTable.CG = {}
$pg.nnTable.CG.match        = 'GC'
$pg.nnTable.CG.enthalpy     = -11.8
$pg.nnTable.CG.entropy      = -29.0
$pg.nnTable.CG.gibbsFE      = -2.8
$pg.nnTable.GC = {}
$pg.nnTable.GC.match        = 'CG'
$pg.nnTable.GC.enthalpy     = -10.5
$pg.nnTable.GC.entropy      = -26.4
$pg.nnTable.GC.gibbsFE      = -2.3
$pg.nnTable.GG = {}
$pg.nnTable.GG.match        = 'CC'
$pg.nnTable.GG.enthalpy     = -10.9
$pg.nnTable.GG.entropy      = -28.4
$pg.nnTable.GG.gibbsFE      = -2.1




$pg.makeTableOne = function(table) {
    var nnTableObject = {};
    for (var i =0;i < table.length ; i++) {
      var key = table[i][0] + (table[i][4] || "");
      nnTableObject[key] = {
        one: table[i][0],
        two: table[i][4],
        deltaH: parseFloat(table[i][1]),  //deltaH is enthalpy
        deltaS: parseFloat(table[i][2]),  //deltaS is entropy
        deltaG: parseFloat(table[i][3]),  //deltaG is gibbs free energy
      };
    }
      return nnTableObject;
  };

$pg.prettyJSON = function(jsonObj){
  return JSON.stringify(jsObj, null, "\t");
};

//make the delta table
$pg.dataTables.nearestNeighborTable = $pg.makeTableOne($pg.dataTables.nnTABLE);


$pg.seqs.candidates     = [];
$pg.seqs.forwardPrimers = [];
$pg.seqs.reversePrimers = [];

$pg.seqs.candidates.push(new $pg.Sequence($pg.genRandomSeq(64), true, 'CandidateSequence'));
$pg.seqs.forwardPrimers.push(new $pg.Sequence($pg.genPrimer($pg.csaSeq.sequence, 0, 21, true),  true, 'forwardPrimer'));
$pg.seqs.reversePrimers.push(new $pg.Sequence($pg.genPrimer($pg.csaSeq.sequence, 0, 20, false), true, 'reversePrimer'));
