Fri 02/06/2026

Please review @docs/master-test-plan.md and consider the following:

traceability of test report/result/logs with reqs and features, document links, test descriptions
- All reqs must be covered by test/verification but not all test/verification may have a specific req associated with it other than a simple request to do a master test run (or big subset thereof). On the other hand, all features must be tested.
- At some point in the traceablity stucture, good test/verification descriptions must be included that give a good single headline with single paragraph as well as what the inputs and outputs of the test are, how it is run and where its implementation is.
	- The main distinction between tests and verifications here is that tests are implemented using code and can be run largely without manual assistance, whereas a verification is largely manual and may have some utility code to assist. In that sense verification can be thought of QA (Quality Assurance) whereas tests are mainly the subject of test engineering usually by a software engineer and could even involve hardware assistance (but this typical for web apps). 
- A singular req for a master test run and nothing is else  needed just to be as clear as possible that the tests have been run prior to release.  
	- Although it's perfectly okay to run tests spontaneously for debugging, thorough testing (such as master test run) for a release is absolutely required. The master test suite strives to be thorough but as efficient as possible without a great deal of overlap, in particular testing with real data with GCP services removes the need to do the same test with mock data. 
	- Note that running a test with mock data can be very useful for quicly zooming in on problems during debug. Thus tests with mock data should never sumarily deleted. 
- For the purposes of traceability, the general scheme of linkage needs to be understood.
	- Raw data and logs can be linked to but generall not linked from (unless they support embedded comments that could contain links).
	- It needs to be understood what the structure of the linkage is. It may be a strictly hierarchial (a tree structure) with directed edge. But it may be Directed Acyclic Graph, possibly with directed edges.  Though it may contain cross links, the structure must layered or otherwise oriented so that it can be understood in a manner to table of contents. Note that a DAG can be containe in a table of contents style organization by having elements at the same level, even the top level if needed. It would be a categorical mistake to think that the orgnization must have a unique root as in tree structure. (Well, so much for a graph-theoretic approach.)
- Later: a procedure for archiving/deleting old test runs


Thu 02/05/2026

❯ I am attempting to merge Matt Maher's do-work based method with Dylan's 50+ method in samkirk.com-v3. So how would I go about installing this into an       
  exisitng project such as                            
  /Users/sam/Projects/samkirk-v3? How much            
  distruption or conflict could I expect to occur?    
  My expectation is that the adaption of the tools    
  in this project into the one I just mentioned       
  would amount to treating the specification.md,      
  blueprint.md  and todo.md markdown files (based on  
  generation them by Dylan-Davis-50plus-method.md)    
  as series of do-work requests using the skills of   
  start-step and continue-skip (perhaps with some     
  modification with more flexible parameterization).  
  As the v2-upgrade*.md files for a follow-on         
  specification, bluerpint and todo indicate, there   
  are always some indefinite number of modification   
  desired after the initial working prototype is      
  tested. I really like the work that the author,     
  Matt Maher, explains in                             
  @docs/Matt-Maher_Claude-Code.html, which provides   
  a larger context of how this repo, do-work, fits    
  into the larger Claude Code workflow he uses. That  
  document contains to his primary videos which you   
  should review as well.        

❯ We need to think about recording the test results as proof  
  positive of testing. Such test report should include a very  
  brief description of the test and the location of the test   
  code for auditing purposes. Although there is a              
  test-results folder, I think a better place would be in the  
  archive folder as separate test file (or folder of files)    
  that is date/time stamped as YYYY-MM-DD_HH:MM:SS using the   
  PST zone. It would be nice if those test results were        
  linked (or even cross-linked) with UR-001, but I don't know  
  how. I like the idea of keeping detailed test results out    
  of the UR folder because documenting ocassional test         
  results can be so awkward: see docs/TEST-RESULTS.md, for     
  example, and the dreadfully long logs in .playwright-mcp,    
  and also  the details of testing as reference (faux) test    
  fixturs in web/test-fixtures. In short, I find it difficult  
  to know what to keep and how to organize it, but Matt's      
  requirement of a traceability for auditing sure sounds like  
  a very good principle.                                       

   ❯ Ok, let's consider an all-encompassing test     
  suite that would rerun all those tests and      
  clear up the tests that failed due to a         
  pre-existing condition. This would include      
  tests that have been created before UR-001 was  
  done. Such a master test script would include   
  the ability to select among unit tests,         
  vitests and e2e tests (notably Playwright       
  tests) as well as an option (where possible)    
  to run with or without GCP setup as well as an  
  option to run tests manually or                 
  automaticdally (esp., e2e tests). Please        
  consider what the hi-level methology docs say   
  about this, viz.,                               
  @docs/Dylan-Davis-50plus-method.md and @docs/M  
  atts-integration-with-Dylan-plan-samkirk-v3.md .

❯ I believe that a separate task for this plan must            
  include whether to fix or delete pre v2-upgrade tests       
  that fail. The plan should at least identify them. In        
  some cases, fixing the plan may duplicate existing tests     
   that are working. Such investigation can be done later      
  after the master test script for know good tests is in       
  place.                                             

 