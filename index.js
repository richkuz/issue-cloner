const core = require('@actions/core');
const github = require('@actions/github');;

async function start(){
    try {
        /*
        uses: dpanayotov/issue-cloner@v0.2
with:
  labelArray: 
    -
        ""
        "label2"
  targetRepo: elastic/enterprise-search-team
  targetLabel: "team:ingestion"
  token: ${{ secrets.CLONE_ISSUE_TOKEN }}
  */
        const targetRepo = core.getInput('targetRepo', {required: true});
        const ghToken = core.getInput('token', {required: true});

        const octokit = new github.getOctokit(ghToken);
        const originalIssue = await getOriginalIssue(octokit);
        
        const clonedIssue = await cloneIssue(octokit, targetRepo, originalIssue)
        
       // await addLabel(octokit, clonedIssue, targetLabel);
        
        await addComment(octokit, originalIssue, clonedIssue)
        
        console.log(`Issue cloned successfully`);      
      } catch (error) {
        core.setFailed(error.message);
      }
}


start();

async function getOriginalIssue(octokit) {
    const payloadIssue = github.context.payload.issue;
    if (!payloadIssue){
        throw new Error("No issue in context");
    }
    const issue = await octokit.rest.issues.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: payloadIssue.number    
    })

    return issue;
}

async function cloneIssue(octokit, targetRepo, original){
    const splitted = targetRepo.split('/');
    const owner = splitted[0];
    const repoName = splitted[1];
    
    const issueRegex = /(?<=^|\s)#\d+(?=\s|$)/g; // #12 as a word in the text
    let body = original.data.body.replace(issueRegex, (match) => {
        const issueNumber = match.substr(1);
        return `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/issues/${issueNumber}`;
    });

    body = `Issue cloned from ${original.data.html_url}\n\n${body}`;

    const title = original.data.title;
    const result = await octokit.rest.issues.create({
        owner: owner,
        repo: repoName,
        body: body,
        title: title
    });
    return result;
}


async function addLabel(octokit, clonedIssue, taregetLabel){
    const result = await octokit.rest.issues.createLabel({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: originalIssue.data.number,
        label: {
            name: targetLabel
        }
    })
    return result;
}

function hasLabel(label, issue){
    console.dir(issue);
    const labels = issue.data.labels;
    for(let l of labels){
        if(label === l.name){
            return true;
        }
    }
    return false;
}
