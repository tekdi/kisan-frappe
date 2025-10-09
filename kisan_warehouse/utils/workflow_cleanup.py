import frappe

def cleanup_all_workflows():
    """
    Complete cleanup of all workflow related data.
    Run in bench console:
    bench --site [sitename] console
    from kisan_warehouse.utils.workflow_cleanup import cleanup_all_workflows
    cleanup_all_workflows()
    """
    
    workflows = [
            "Kisan Customer Approval",
            "Kisan Company Approval",
            "Kisan Product Approval",
            "Kisan Vehicle Approval",
            "Kisan Warehouse Approval",
            "Kisan Broker Approval",
            "Kisan Inward Approval",
            "Kisan Sauda Approval"
    ]

    frappe.db.begin()
    
    try:
        for workflow_name in workflows:
            print(f"\n{'='*60}")
            print(f"Cleaning up workflow: {workflow_name}")
            print(f"{'='*60}")
            
            # 1. Delete Workflow Actions
            actions = frappe.get_all("Workflow Action", 
                                     filters={"reference_doctype": workflow_name},
                                     pluck="name")
            for action in actions:
                frappe.delete_doc("Workflow Action", action, force=True)
                print(f"  ✓ Deleted Workflow Action: {action}")
            
            # 2. Delete Workflow Document States
            doc_states = frappe.get_all("Workflow Document State",
                                        filters={"parent": workflow_name},
                                        pluck="name")
            for doc_state in doc_states:
                frappe.delete_doc("Workflow Document State", doc_state, force=True)
                print(f"  ✓ Deleted Workflow Document State: {doc_state}")
            
            # 3. Get the workflow document
            if frappe.db.exists("Workflow", workflow_name):
                workflow_doc = frappe.get_doc("Workflow", workflow_name)
                
                # Clear child tables first
                workflow_doc.states = []
                workflow_doc.transitions = []
                workflow_doc.save()
                print(f"  ✓ Cleared states and transitions")
                
                # 4. Delete the workflow itself
                frappe.delete_doc("Workflow", workflow_name, force=True)
                print(f"  ✓ Deleted Workflow: {workflow_name}")
            else:
                print(f"  ! Workflow {workflow_name} does not exist")
        
        # 5. Delete orphaned Workflow Transitions
        frappe.db.sql("""
            DELETE FROM `tabWorkflow Transition`
            WHERE parent IN (%s)
        """ % ','.join(['%s'] * len(workflows)), tuple(workflows))
        print("  ✓ Deleted orphaned Workflow Transitions")
        
        # 6. Delete orphaned Workflow Document States
        frappe.db.sql("""
            DELETE FROM `tabWorkflow Document State`
            WHERE parent IN (%s)
        """ % ','.join(['%s'] * len(workflows)), tuple(workflows))
        print("  ✓ Deleted orphaned Workflow Document States")
        
        frappe.db.commit()
        print(f"\n{'='*60}")
        print("✓ All workflows cleaned up successfully!")
        print(f"{'='*60}\n")
        
    except Exception as e:
        frappe.db.rollback()
        print(f"\n✗ Error occurred: {str(e)}")
        print("Changes have been rolled back")
        raise


def verify_cleanup():
    """Verify that all workflows are cleaned up"""
    workflows = [
        "Kisan Customer Approval",
        "Kisan Company Approval",
        "Kisan Product Approval",
        "Kisan Vehicle Approval",
        "Kisan Warehouse Approval",
        "Kisan Broker Approval",
        "Kisan Inward Approval",
        "Kisan Sauda Approval"
    ]
    
    print(f"\n{'='*60}")
    print("VERIFICATION REPORT")
    print(f"{'='*60}\n")
    
    all_clean = True
    for workflow_name in workflows:
        exists = frappe.db.exists("Workflow", workflow_name)
        status = "STILL EXISTS" if exists else "✓ Cleaned"
        print(f"{workflow_name}: {status}")
        if exists:
            all_clean = False
    
    print(f"\n{'='*60}")
    if all_clean:
        print("✓ All workflows have been successfully removed!")
    else:
        print("⚠ Some workflows still exist. Run cleanup again.")
    print(f"{'='*60}\n")


def safe_workflow_import():
    """
    Safely import workflows from fixtures after cleanup.
    """
    try:
        print("Starting workflow import from fixtures...")
        frappe.reload_doc("core", "doctype", "workflow")
        frappe.reload_doc("core", "doctype", "workflow_state")
        frappe.reload_doc("core", "doctype", "workflow_transition")
        frappe.reload_doc("core", "doctype", "workflow_document_state")
        
        from frappe.modules.import_file import import_files
        import_files()
        
        print("✓ Workflows imported successfully!")
        
    except Exception as e:
        print(f"✗ Error during import: {str(e)}")
        raise

def setup_workflows():
    """Setup workflows after migration"""
    try:
        cleanup_all_workflows()
        print("✓ Workflows cleaned up before fixture import")
    except Exception as e:
        print(f"Note: {str(e)}")